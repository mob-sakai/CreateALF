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
        yield unityInstaller.ExecuteSetUp(version, option);
        const u = new Unity("2018.3.10f1", "WebGL");
        yield u.install();
        yield u.run(option.ulf, path.resolve("."), "-quit");
    });
}
class Unity {
    constructor(version, packages) {
        this.version = version;
        this.packages = packages;
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
    // `-t -u ${this.version} -- -quit -batchmode -nographics -manualLicenseFile .ulf -logFile .log`
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
    createAlf() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.u3dRun(`-createManualActivationFile -logFile .log`);
            console.log(fs.readFileSync(".log", "utf-8"));
            console.log("---- alfを適切に処理してください ----");
            console.log("---- ここから ----");
            console.log(fs.readFileSync(`Unity_v${this.version}.alf`, "utf-8"));
            console.log("---- ここまで ----");
        });
    }
    run(ulf, projectPath, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ulf) {
                core.setFailed(`Secret is undefined.`);
                yield this.createAlf();
                return;
            }
            console.log("マニュアルアクティベート実行");
            fs.writeFileSync(".ulf", ulf || "", "utf-8");
            yield this.u3dRun(`-manualLicenseFile .ulf -logFile .log`);
            console.log(fs.readFileSync(".log", "utf-8"));
            const log = fs.readFileSync(".log", "utf-8");
            if (!/ Next license update check is after /.test(log)) {
                console.log("アクティベートに失敗");
                core.setFailed(`Secret is not available.`);
                yield this.createAlf();
            }
            console.log("プロジェクト実行");
            const code = yield this.u3dRun(`-projectPath ${projectPath} ${args}`);
            console.log("プロジェクト終了");
            console.log(`exit code = ${code}`);
            console.log("マニュアルアクティベート返却");
            yield this.u3dRun(`-returnlicense -logFile .log`);
            console.log(fs.readFileSync(".log", "utf-8"));
        });
    }
}
// export async function install() {
//   const u = new Unity("2018.3.10f1", "WebGL");
//   await u.install();
//   await u.run(path.resolve("."), "-quit");
// }
Run();
