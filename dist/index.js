"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const installer_1 = require("./Installers/installer");
const core_1 = require("@actions/core");
const tc = __importStar(require("@actions/tool-cache"));
const core = __importStar(require("@actions/core"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const exec_1 = require("@actions/exec");
const github = __importStar(require("@actions/github"));
function Run() {
    return __awaiter(this, void 0, void 0, function* () {
        const version = core_1.getInput("unity-version", { required: true });
        const unityInstaller = installer_1.CreateInstaller();
        const ulfKey = `ULF_${unityInstaller.GetPlatform()}_${version.split(".")[0]}`;
        core_1.setOutput("id", unityInstaller.GetId(version));
        const option = {
            "has-android": core_1.getInput("has-android", { required: false }),
            "has-il2cpp": core_1.getInput("has-il2cpp", { required: false }),
            "has-ios": core_1.getInput("has-ios", { required: false }),
            "has-mac-mono": core_1.getInput("has-mac-mono", { required: false }),
            "has-webgl": core_1.getInput("has-webgl", { required: false }),
            "has-windows-mono": core_1.getInput("has-windows-mono", { required: false }),
            ulfKey: ulfKey,
            ulf: JSON.parse(core_1.getInput("secrets", { required: true }))[ulfKey],
            args: core_1.getInput("args", { required: true })
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
        const secrets = JSON.parse(core_1.getInput("secrets", { required: true }));
        yield u.createAlfIssue("thisisalf", secrets["GITHUB_TOKEN"] || "");
        return;
        yield u.install();
        if (yield u.activate(secrets[u.ulfKey])) {
            yield u.run(project_path, args);
            yield u.deactivate();
        }
        else {
            const alf = yield u.createAlf();
            yield u.createAlfIssue(alf, secrets["GITHUB_TOKEN"] || "");
        }
    });
}
class Unity {
    constructor(version, packages) {
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
    u3d(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const exe = process.platform == "win32" ? "u3d.bat" : "u3d";
            return exec_1.exec(`${exe} ${args}`, [], {
                failOnStdErr: false,
                ignoreReturnCode: true,
                windowsVerbatimArguments: true
            });
        });
    }
    u3dRun(args, quit = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const exe = process.platform == "win32" ? "u3d.bat" : "u3d";
            const q = quit ? "-quit" : "";
            return this.u3d(`-t -u ${this.version} -- ${q} -batchmode -nographics ${args}`);
        });
    }
    gem(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const exe = process.platform == "win32" ? "gem.cmd" : "gem";
            yield exec_1.exec(`${exe} ${args}`);
        });
    }
    install() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("rubyをインストールします");
            core.addPath(path.join(tc.find("Ruby", "2.6.x"), "bin"));
            console.log("u3dをインストールします");
            yield this.gem(`install u3d`);
            console.log("Unityをインストールします");
            yield this.u3d(`install ${this.version}`);
            if (this.packages) {
                console.log("Unityパッケージをインストールします");
                yield this.u3d(`install ${this.version} -p ${this.packages}`);
            }
        });
    }
    activate(ulf) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ulf) {
                console.log("ulfがない");
                core.setFailed(`Secret '${this.ulfKey}' is undefined.`);
                return false;
            }
            console.log("マニュアルアクティベート実行");
            fs.writeFileSync(".ulf", ulf || "", "utf-8");
            yield this.u3dRun(`-manualLicenseFile .ulf -logFile .log`);
            console.log(fs.readFileSync(".log", "utf-8"));
            const log = fs.readFileSync(".log", "utf-8");
            if (!/ Next license update check is after /.test(log)) {
                console.log("アクティベートに失敗");
                core.setFailed(`Secret is not available.`);
                return false;
            }
            console.log("マニュアルアクティベート終了");
            return true;
        });
    }
    createAlf() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.u3dRun(`-createManualActivationFile -logFile .log`);
            console.log(fs.readFileSync(".log", "utf-8"));
            console.log("---- alfを適切に処理してください ----");
            console.log("---- ここから ----");
            console.log(fs.readFileSync(`Unity_v${this.version}.alf`, "utf-8"));
            console.log("---- ここまで ----");
            return fs.readFileSync(`Unity_v${this.version}.alf`, "utf-8");
        });
    }
    createAlfIssue(alf, token) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(github.context);
            const octokit = new github.GitHub(token || "");
            const title = `[Actions] Secret '${this.ulfKey}' has been requestd`;
            const body = `Secret '${this.ulfKey}' has been requestd by workflow '${github.context.workflow}'\n\n
### 1. 以下のテキストを \`Unity_v${this.version}.alf\` として保存する.\n\n
\`\`\`
${alf}
\`\`\`
\n\n
### 2. 以下のページでマニュアルアクティベートし、ulfをダウンロードする.\n\n
https://license.unity3d.com/manual
\n\n
### 3. リポジトリのSecretに'${this.ulfKey}'を追加/更新する.\n\n
URL
    `;
            const rr = yield octokit.issues.create(Object.assign(Object.assign({}, github.context.repo), { title,
                body }));
            console.log(rr.data);
        });
    }
    deactivate() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("マニュアルアクティベート返却");
            yield this.u3dRun(`-returnlicense -logFile .log`);
            console.log(fs.readFileSync(".log", "utf-8"));
            console.log("マニュアルアクティベート返却終了");
        });
    }
    run(projectPath, args) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("プロジェクト実行");
            const code = yield this.u3dRun(`-projectPath ${projectPath} ${args}`);
            console.log("プロジェクト終了");
            console.log(`exit code = ${code}`);
        });
    }
}
// export async function install() {
//   const u = new Unity("2018.3.10f1", "WebGL");
//   await u.install();
//   await u.run(path.resolve("."), "-quit");
// }
Run();
