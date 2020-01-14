import { CreateInstaller } from "./Installers/installer";
import { InstallOption } from "./Installers/installer_definition";
import { getInput, setOutput } from "@actions/core";
import * as tc from "@actions/tool-cache";

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

export async function findRubyVersion() {
  const versions: string[] = tc.findAllVersions("Ruby");
  console.log("Ruby");
  console.log(versions);

  // const installDir: string | null = tc.find("Ruby", version);

  // if (!installDir) {
  //   throw new Error(`Version ${version} not found`);
  // }

  // const toolPath: string = path.join(installDir, "bin");

  // core.addPath(toolPath);
}

export async function findU3d() {
  const versions: string[] = tc.findAllVersions("u3d");

  console.log("u3d");
  console.log(versions);

  // if (!installDir) {
  //   throw new Error(`Version ${version} not found`);
  // }

  // const toolPath: string = path.join(installDir, "bin");

  // core.addPath(toolPath);
}

// Run();

findRubyVersion();
findU3d();
