import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as path from "path";
import * as fs from "fs";

export class Unity {
  version: string;
  packages: string;
  username: string = "";
  password: string = "";
  constructor(version: string, packages: string) {
    this.version = version;
    this.packages = packages;
  }

  async u3d(args: string): Promise<number> {
    const exe = process.platform == "win32" ? "u3d.bat" : "u3d";
    return exec.exec(`${exe} -t --verbose ${args}`, [], {
      failOnStdErr: false,
      ignoreReturnCode: true,
      windowsVerbatimArguments: true
    });
  }

  async u3dRun(
    args: string,
    log: string,
    quit: boolean = true
  ): Promise<number> {
    const exe =
      process.platform == "win32"
        ? `C:\\Program Files\\Unity_${this.version}\\Editor\\Unity.exe`
        : "u3d";

    const exitCode = await exec.exec(
      `"${exe}" -logFile ${log} -username ${this.username} -password ${this.password} ${args}`,
      [],
      {
        failOnStdErr: false,
        ignoreReturnCode: true,
        windowsVerbatimArguments: true
      }
    );
    console.log(fs.readFileSync(log, "utf-8"));

    return exitCode;
  }

  async gem(args: string) {
    const exe = process.platform == "win32" ? "gem.cmd" : "gem";
    await exec.exec(`${exe} ${args}`);
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

  async activate(ulf: string): Promise<boolean> {
    if (!ulf) {
      return false;
    }

    const ulfPath = `Unity_v${this.version.split(".")[0]}.x.ulf`;
    fs.writeFileSync(ulfPath, (ulf || "").replace("\r", ""), "utf-8");
    await this.u3dRun(`-quit -batchmode -manualLicenseFile ${ulfPath}`, "activate.log");
    console.log(fs.readFileSync("activate.log", "utf-8"));

    await this.u3d(`licenses`);

    const log = fs.readFileSync("activate.log", "utf-8");
    if (!/ Next license update check is after /.test(log)) {
      return false;
    }

    console.log("マニュアルアクティベートテスト");
    const exitCode = await this.u3dRun(`-quit -batchmode`, "activate-check.log");
    return exitCode == 0;
  }

  async createAlf(): Promise<string> {
    console.log("マニュアルアクティベート作成");
    await this.u3dRun(`-quit -batchmode -createManualActivationFile`, "createAlf.log");
    console.log(fs.readFileSync("createAlf.log", "utf-8"));

    console.log("マニュアルアクティベート作成完了");
    return fs.readFileSync(`Unity_v${this.version}.alf`, "utf-8");
  }

  async run(projectPath: string, args: string): Promise<number> {
    console.log("プロジェクト実行");
    const exitCode = await this.u3dRun(
      `-batchmode -projectPath ${projectPath} ${args}`,
      "run.log"
    );
    console.log(fs.readFileSync("run.log", "utf-8"));
    return exitCode;
  }
}
