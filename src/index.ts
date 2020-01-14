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
import * as github from "@actions/github";
import { eventNames } from "cluster";
import { Context } from "@actions/github/lib/context";

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

  console.log(process.platform);
  console.log("Unityがキャッシュにある？");
  console.log(tc.findAllVersions("Unity"));

  const version_ = "2018.3.11f1";
  const modules = "";
  const project_path = ".";
  const args = "";

  const secrets = JSON.parse(getInput("secrets", { required: true }));
  const unity = new Unity(version_, modules);
  await unity.install();

  const ulfSecret = secrets[getUlfSecret(version_)];
  const ulf = secrets[ulfSecret];
  if (await unity.activate(ulf)) {
    await unity.run(project_path, args);
    await unity.deactivate();
  } else {
    // const ulfSecret = unity.getUlfSecret();
    core.setFailed(`Secret '${ulfSecret}' is undefined.`);

    const alf = await unity.createAlf();
    const token = secrets["GITHUB_TOKEN"];
    const alfName = `Unity_v${unity.version}.alf`;
    const ulfName = `Unity_v${unity.version.split(".")[0]}.x.ulf`;
    const title = `[Actions] Secret '${ulfSecret}' has been requested by workflow '${github.context.workflow}'`;
    const body = `### Follow the instructions below to set up secret \`${ulfSecret}\`.

1. Save the following text as \`${alfName}\`.  
\`\`\`
${alf}
\`\`\`
2. Activate \`${alfName}\` on the following page and download \`${ulfName}\`.  
https://license.unity3d.com/manual
3. Add/update the contents of \`${ulfName}\` as secret \`${ulfSecret}\`.  
${github.context.payload.repository?.html_url}/settings/secrets
`;

    await new github.GitHub(token || "").issues.create({
      ...github.context.repo,
      title,
      body
    });
  }
}

function getUlfSecret(version: string): string {
  const major = version.split(".")[0];
  switch (process.platform) {
    case "darwin":
      return "UNITY_OSX_" + major;
    case "win32":
      return "UNITY_WIN_" + major;
    default:
      return "UNITY_LINUX_" + major;
  }
}

class Unity {
  version: string;
  packages: string;
  constructor(version: string, packages: string) {
    this.version = version;
    this.packages = packages;
  }

  // getUlfSecret(): string {
  //   const major = this.version.split(".")[0];
  //   switch (process.platform) {
  //     case "darwin":
  //       return "UNITY_OSX_" + major;
  //     case "win32":
  //       return "UNITY_WIN_" + major;
  //     default:
  //       return "UNITY_LINUX_" + major;
  //   }
  // }

  async u3d(args: string): Promise<number> {
    const exe = process.platform == "win32" ? "u3d.bat" : "u3d";
    return exec(`${exe} ${args}`, [], {
      failOnStdErr: false,
      ignoreReturnCode: true,
      windowsVerbatimArguments: true
    });
  }

  async u3dRun(args: string, quit: boolean = true): Promise<number> {
    const q = quit ? "-quit" : "";
    return this.u3d(
      `-u ${this.version} -- ${q} -batchmode -nographics ${args}`
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

  async activate(ulf: string): Promise<boolean> {
    if (!ulf) {
      console.log("ulfがない");
      return false;
    }

    console.log("マニュアルアクティベート実行");
    fs.writeFileSync(".ulf", ulf || "", "utf-8");
    await this.u3dRun(`-manualLicenseFile .ulf -logFile .log`);
    console.log(fs.readFileSync(".log", "utf-8"));

    const log = fs.readFileSync(".log", "utf-8");
    if (!/ Next license update check is after /.test(log)) {
      console.log("アクティベートに失敗");
      return false;
    }

    console.log("マニュアルアクティベート成功");
    return true;
  }

  async createAlf(): Promise<string> {
    console.log("マニュアルアクティベート作成");
    await this.u3dRun(`-createManualActivationFile -logFile .log`);
    console.log(fs.readFileSync(".log", "utf-8"));
    console.log("マニュアルアクティベート作成完了");
    return fs.readFileSync(`Unity_v${this.version}.alf`, "utf-8");
  }

  //   async createAlfIssue(
  //     alf: string,
  //     token: string | undefined,
  //     context: Context
  //   ): Promise<void> {
  //     const alfName = `Unity_v${this.version}.alf`;
  //     const ulfName = `Unity_v${this.version.split(".")[0]}.x.ulf`;
  //     const title = `[Actions] Secret '${this.getUlfSecret()}' has been requested by workflow '${
  //       context.workflow
  //     }'`;
  //     const body = `### Follow the instructions below to set up secret '${this.getUlfSecret()}'.

  // 1. Save the following text as \`${alfName}\`.
  // \`\`\`
  // ${alf}
  // \`\`\`
  // 2. Activate \`${alfName}\` on the following page and download \`${ulfName}\`.
  // https://license.unity3d.com/manual
  // 3. Add/update the contents of \`${ulfName}\` as secret '${this.getUlfSecret()}'.
  // ${github.context.payload.repository?.html_url}/settings/secrets
  // `;

  //     await new github.GitHub(token || "").issues.create({
  //       ...context.repo,
  //       title,
  //       body
  //     });
  //   }

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

    if (code != 0) {
      core.setFailed("Unity failed with exit code 1");
    }
  }
}

// export async function install() {
//   const u = new Unity("2018.3.10f1", "WebGL");
//   await u.install();
//   await u.run(path.resolve("."), "-quit");
// }

Run();
