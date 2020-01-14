import { CreateInstaller } from "./Installers/installer";
import { InstallOption } from "./Installers/installer_definition";
import { getInput, setOutput } from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as path from "path";
import * as fs from "fs";
import { exec } from "@actions/exec";
import { stringify } from "querystring";
import * as io from "@actions/io";
import { eventNames } from "cluster";

async function Run() {
  const version = getInput("unity-version", { required: true });
  const unityInstaller = CreateInstaller();
  const ulfKey = `ULF_${unityInstaller.GetPlatform()}_${version.split(".")[0]}`;
  setOutput("id", unityInstaller.GetId(version));
  const option: InstallOption = {
    "has-android": getInput("has-android", { required: false }),
    "has-il2cpp": getInput("has-il2cpp", { required: false }),
    "has-ios": getInput("has-ios", { required: false }),
    "has-mac-mono": getInput("has-mac-mono", { required: false }),
    "has-webgl": getInput("has-webgl", { required: false }),
    "has-windows-mono": getInput("has-windows-mono", { required: false }),
    ulfKey: ulfKey,
    ulf: JSON.parse(getInput("secrets", { required: true }))[ulfKey],
    args: getInput("args", { required: true })
  };
  await unityInstaller.ExecuteSetUp(version, option);
}

export function findRubyVersion(version: string) {
  const installDir: string | null = tc.find("Ruby", version);

  if (!installDir) {
    throw new Error(`Version ${version} not found`);
  }

  const toolPath: string = path.join(installDir, "bin");

  core.addPath(toolPath);
}

class Unity {
  version: string;
  packages: string;
  cwd: string;
  args: string;
  gem: string = "gem";
  u3d: string = "u3d";
  installPath: string = "u3d";
  semver: string;
  constructor(
    version: string,
    packages: string,
    cwd: string | undefined = undefined,
    args: string | undefined = undefined
  ) {
    this.version = version;
    var m = version.match(/([\d\.]+)(.*)/);
    this.semver = m ? `${m[1]}-${m[2]}` : "";
    this.packages = packages;
    this.cwd = cwd || process.cwd();
    this.args = args || "";
    if (process.platform == "win32") {
      this.gem += ".cmd";
      this.u3d += ".bat";
    }
    this.installPath = `C:\\Program Files\\Unity_${version}`;
  }

  async run(): Promise<void> {
    console.log("rubyをインストールします");
    core.addPath(path.join(tc.find("Ruby", "2.6.x"), "bin"));

    console.log("u3dをインストールします");
    await exec(`${this.gem} install u3d`);

    console.log(`Unityのインストールをチェック Unity ${this.semver}`);
    const installDir: string | null = tc.find("Unity", this.semver);

    let installedFiles = 0;
    if (installDir) {
      console.log("Unityはインストール済みです");
      console.log(installDir);
      console.log("コピーします");
      await io.cp(installDir, this.installPath, {
        force: true,
        recursive: true
      });
      installedFiles = fs.readdirSync(this.installPath).length;
    } else {
      console.log("Unityは未インストールです");
      console.log("インストールします");
      await exec(`${this.u3d} install ${this.version}`);
    }

    if (this.packages) {
      console.log(
        "Unityのパッケージをインストールします。インストール済みのものはスキップされます。"
      );
      await exec(`${this.u3d} install ${this.version} -p ${this.packages}`);
    }

    if (installedFiles != fs.readdirSync(this.installPath).length) {
      console.log("インストールによって、ファイル数が変化しました");
      console.log(`Unityをキャッシュします Unity ${this.version}`);
      await tc.cacheDir(`${this.installPath}`, "Unity", this.semver);
      console.log(
        `Unityは次のディレクトリにキャッシュされました ${tc.find(
          "Unity",
          this.semver
        )}`
      );
    }

    console.log("Unityの実行");
    console.log(`args: ${this.args},`);
    console.log(`cwd: ${this.cwd},`);

    await exec(`${this.u3d} -- -batchmode ${this.args}`, [], { cwd: this.cwd });
  }
}

// export async function gem(args: string) {
//   const exe: string = process.platform == "win32" ? "gem.cmd" : "gem";
//   await exec(`${exe} ${args}`);
// }

// export async function u3d(args: string) {
//   const exe: string = process.platform == "win32" ? "u3d.bat" : "u3d";
//   await exec(`${exe} ${args}`);
// }

// export async function installUnity(
//   version: string,
//   packages: string | undefined
// ) {
//   await gem(`install u3d`);
//   await gem(`which u3d`);
//   await u3d(`available`);
//   await u3d(`install ${version}`);
//   await u3d(`list`);
//   if (packages) await u3d(`install ${version} -p ${packages}`);
//   // await exec(`${gem} install u3d`);
//   // await exec(`${gem} which u3d`);
//   // await exec(`${u3d} available`);
//   // await exec(`${u3d} install ${version}`);
//   // if (packages) await exec(`${u3d} install ${version} -p ${packages}`);
//   // await exec(`${u3d} list`);
// }

export async function install() {
  const u = new Unity("2018.3.10f1", "WebGL");
  await u.run();
  return;

  // findRubyVersion("2.6.x");
  // // process.env["PATH"] += `;${toolPath}`;

  // // console.log(fs.existsSync(path.join(toolPath, "gem")));
  // // console.log(process.env["PATH"]);

  // if (process.platform == "win32") {
  //   await installUnity(version, "WebGL");
  //   // await exec(`gem.cmd install u3d`);
  //   // await exec(`u3d.bat available`);
  //   // await exec(`u3d.bat install ${version}`);
  //   // await exec(`u3d.bat install ${version} -p WebGL`);
  //   // await exec(`u3d.bat list`);
  //   await tc.cacheDir(
  //     `C:\\Program Files\\Unity_${version}`,
  //     "Unity",
  //     "2018.3.13-f1"
  //   );
  //   console.log(tc.find("Unity", "2018.3.13-f1"));
  //   console.log("finish !!!");
  // } else {
  //   await exec(`gem install u3d`);
  //   await exec(`u3d available`);
  //   await exec(`u3d install ${version}`);
  //   await exec(`u3d install ${version} -p WebGL`);
  //   await exec(`u3d list`);
  //   if (process.platform == "darwin")
  //     tc.cacheDir(`/Application/Unity_${version}`, "Unity", version);
  //   else tc.cacheDir(`/opt/unity-ediotr-${version}`, "Unity", version);
  //   console.log(tc.find("Unity", version));
  // }
}

install();
