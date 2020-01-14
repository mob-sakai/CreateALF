import { Installer } from "./installer_definition";
import { LinuxInstaller } from "./LinuxInstaller";
import { WindowsInstaller } from "./WindowsInstaller";
import { MacOSInstaller } from "./MacOSInstaller";
import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as path from "path";
import { exec } from '@actions/exec';

export function CreateInstaller(): Installer {
  switch (process.platform) {
    case "darwin":
      return new MacOSInstaller();
    case "win32":
      return new WindowsInstaller();
    default:
      return new LinuxInstaller();
  }
}

export async function findRubyVersion(version: string) {
  const installDir: string | null = tc.find("Ruby", version);

  if (!installDir) {
    throw new Error(`Version ${version} not found`);
  }

  const toolPath: string = path.join(installDir, "bin");

  core.addPath(toolPath);
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

