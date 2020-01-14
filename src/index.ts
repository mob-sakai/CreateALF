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

export function findRubyVersion(version: string): string {
  const installDir: string | null = tc.find("Ruby", version);

  if (!installDir) {
    throw new Error(`Version ${version} not found`);
  }

  const toolPath: string = path.join(installDir, "bin");

  core.addPath(toolPath);
  return toolPath;
}

export async function install() {
  const toolPath = findRubyVersion("2.6.x");
  process.env["PATH"] += `;${toolPath}`;

  console.log(fs.existsSync(path.join(toolPath, "gem")));
  console.log(process.env["PATH"]);
  await exec(`echo %PATH%`);
  
  if (process.platform == "win32") await exec(`gem.cmd install u3d`);
  else await exec(`gem install u3d`);

  await exec("u3d available");
}

install();
