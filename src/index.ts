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
  // await unityInstaller.ExecuteSetUp(version, option);

  // const version_ = getInput("unity-version", { required: true }) || '2018.3.11f1';
  // const modules = getInput("unity-modules", { required: false }) || '';
  // const project_path = getInput("project-path", { required: false }) || '.';
  // const args = getInput("args", { required: false }) || '';

  const version_ = "2018.3.11f1";
  const modules = "";
  const project_path = ".";
  const args = "";

  const u = new Unity(version_, modules);
  const ulf = JSON.parse(getInput("secrets", { required: true }))[u.ulfKey];
  await u.install();
  if (await u.activate(ulf)) {
    await u.run(project_path, args);
    await u.deactivate();
  }
}

class Unity {
  version: string;
  packages: string;
  ulfKey: string;
  constructor(version: string, packages: string) {
    this.version = version;
    this.packages = packages;
    const major = version.split(".")[0];

    switch (process.platform) {
      case "darwin":
        this.ulfKey = "UNITY_OSX_" + major;
      case "win32":
        this.ulfKey = "UNITY_WIN_" + major;
      default:
        this.ulfKey = "UNITY_LINUX_" + major;
    }
  }

  async u3d(args: string): Promise<number> {
    const exe = process.platform == "win32" ? "u3d.bat" : "u3d";
    return exec(`${exe} ${args}`, [], {
      failOnStdErr: false,
      ignoreReturnCode: true,
      windowsVerbatimArguments: true
    });
  }

  async u3dRun(args: string, quit: boolean = true): Promise<number> {
    const exe = process.platform == "win32" ? "u3d.bat" : "u3d";
    const q = quit ? "-quit" : "";
    return this.u3d(
      `-t -u ${this.version} -- ${q} -batchmode -nographics ${args}`
    );
  }

  async gem(args: string) {
    const exe = process.platform == "win32" ? "gem.cmd" : "gem";
    await exec(`${exe} ${args}`);
  }

  async install(): Promise<void> {
    console.log("rubyをインストールします");
    core.addPath(path.join(tc.find("Ruby", "2.6.x"), "bin"));

    console.log("u3dをインストールします");
    await this.gem(`install u3d`);

    console.log("Unityをインストールします");
    await this.u3d(`install ${this.version}`);

    if (this.packages) {
      console.log("Unityパッケージをインストールします");
      await this.u3d(`install ${this.version} -p ${this.packages}`);
    }
  }

  async activate(ulf: string | undefined): Promise<boolean> {
    if (!ulf) {
      console.log("ulfがない");
      core.setFailed(`Secret '${this.ulfKey}' is undefined.`);
      await this.createAlf();
      return false;
    }

    console.log("マニュアルアクティベート実行");
    fs.writeFileSync(".ulf", ulf || "", "utf-8");
    await this.u3dRun(`-manualLicenseFile .ulf -logFile .log`);
    console.log(fs.readFileSync(".log", "utf-8"));

    const log = fs.readFileSync(".log", "utf-8");
    if (!/ Next license update check is after /.test(log)) {
      console.log("アクティベートに失敗");
      core.setFailed(`Secret is not available.`);
      await this.createAlf();
      return false;
    }

    console.log("マニュアルアクティベート終了");
    return true;
  }

  async createAlf(): Promise<void> {
    await this.u3dRun(`-createManualActivationFile -logFile .log`);
    console.log(fs.readFileSync(".log", "utf-8"));

    console.log("---- alfを適切に処理してください ----");
    console.log("---- ここから ----");
    console.log(fs.readFileSync(`Unity_v${this.version}.alf`, "utf-8"));
    console.log("---- ここまで ----");
  }

  async deactivate(): Promise<void> {
    console.log("マニュアルアクティベート返却");
    await this.u3dRun(`-returnlicense -logFile .log`);
    console.log(fs.readFileSync(".log", "utf-8"));
    console.log("マニュアルアクティベート返却終了");
  }

  async run(projectPath: string, args: string): Promise<void> {
    console.log("プロジェクト実行");
    const code = await this.u3dRun(`-projectPath ${projectPath} ${args}`);
    console.log("プロジェクト終了");
    console.log(`exit code = ${code}`);
  }
}

// export async function install() {
//   const u = new Unity("2018.3.10f1", "WebGL");
//   await u.install();
//   await u.run(path.resolve("."), "-quit");
// }

Run();
