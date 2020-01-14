import { CreateInstaller } from "./Installers/installer";
import { InstallOption } from "./Installers/installer_definition";
import { getInput, setOutput } from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as path from "path";
import * as fs from "fs";
import { exec } from "@actions/exec";
import { stringify } from "querystring";

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

class Inst {
  version: string;
  gem: string = 'gem';
  u3d: string = 'u3d';
  constructor(version: string){
      this.version = version;
      if(process.platform == "win32")
      {
        this.gem += '.cmd';
        this.u3d += '.bat';
      }
  }
}

export async function gem(args: string) {
  const exe: string = process.platform == "win32" ? "gem.cmd" : "gem";
  await exec(`${exe} ${args}`);
}

export async function u3d(args: string) {
  const exe: string = process.platform == "win32" ? "u3d.bat" : "u3d";
  await exec(`${exe} ${args}`);
}

export async function installUnity(
  version: string,
  packages: string | undefined
) {
  await gem(`install u3d`);
  await gem(`which u3d`);
  await u3d(`available`);
  await u3d(`install ${version}`);
  await u3d(`list`);
  if (packages) await u3d(`install ${version} -p ${packages}`);
}

export async function install() {
  findRubyVersion("2.6.x");
  // process.env["PATH"] += `;${toolPath}`;

  // console.log(fs.existsSync(path.join(toolPath, "gem")));
  // console.log(process.env["PATH"]);

  const version = "2018.3.13f1";

  if (process.platform == "win32") {
    await installUnity(version, 'WebGL');
    // await exec(`gem.cmd install u3d`);
    // await exec(`u3d.bat available`);
    // await exec(`u3d.bat install ${version}`);
    // await exec(`u3d.bat install ${version} -p WebGL`);
    // await exec(`u3d.bat list`);
    await tc.cacheDir(`C:\\Program Files\\Unity_${version}`, "Unity", "2018.3.13-f1");
    console.log(tc.find("Unity", "2018.3.13-f1"));
    console.log('finish !!!');
  } else {
    await exec(`gem install u3d`);
    await exec(`u3d available`);
    await exec(`u3d install ${version}`);
    await exec(`u3d install ${version} -p WebGL`);
    await exec(`u3d list`);
    if (process.platform == "darwin")
      tc.cacheDir(`/Application/Unity_${version}`, "Unity", version);
    else tc.cacheDir(`/opt/unity-ediotr-${version}`, "Unity", version);
    console.log(tc.find("Unity", version));
  }
}

install();
