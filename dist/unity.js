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
const tc = __importStar(require("@actions/tool-cache"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class Unity {
    constructor(version, packages) {
        this.username = "";
        this.password = "";
        this.version = version;
        this.packages = packages;
    }
    u3d(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const exe = process.platform == "win32" ? "u3d.bat" : "u3d";
            return exec.exec(`${exe} -t --verbose ${args}`, [], {
                failOnStdErr: false,
                ignoreReturnCode: true,
                windowsVerbatimArguments: true
            });
        });
    }
    u3dRun(args, log, quit = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const exe = process.platform == "win32"
                ? `C:\\Program Files\\Unity_${this.version}\\Editor\\Unity.exe`
                : "u3d";
            const exitCode = yield exec.exec(`"${exe}" -logFile ${log} -username ${this.username} -password ${this.password} ${args}`, [], {
                failOnStdErr: false,
                ignoreReturnCode: true,
                windowsVerbatimArguments: true
            });
            console.log(fs.readFileSync(log, "utf-8"));
            return exitCode;
        });
    }
    gem(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const exe = process.platform == "win32" ? "gem.cmd" : "gem";
            yield exec.exec(`${exe} ${args}`);
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
                return false;
            }
            const ulfPath = `Unity_v${this.version.split(".")[0]}.x.ulf`;
            fs.writeFileSync(ulfPath, (ulf || "").replace("\r", ""), "utf-8");
            yield this.u3dRun(`-nographics -quit -batchmode -manualLicenseFile ${ulfPath}`, "activate.log");
            console.log(fs.readFileSync("activate.log", "utf-8"));
            yield this.u3d(`licenses`);
            const log = fs.readFileSync("activate.log", "utf-8");
            if (!/ Next license update check is after /.test(log)) {
                return false;
            }
            console.log("マニュアルアクティベートテスト");
            const exitCode = yield this.u3dRun(`-nographics -quit -batchmode`, "activate-check.log");
            return exitCode == 0;
        });
    }
    createAlf() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("マニュアルアクティベート作成");
            yield this.u3dRun(`-nographics -quit -batchmode -createManualActivationFile`, "createAlf.log");
            console.log(fs.readFileSync("createAlf.log", "utf-8"));
            console.log("マニュアルアクティベート作成完了");
            return fs.readFileSync(`Unity_v${this.version}.alf`, "utf-8");
        });
    }
    run(projectPath, args) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("プロジェクト実行");
            const exitCode = yield this.u3dRun(`-quit -nographics -batchmode -projectPath ${projectPath} ${args}`, "run.log");
            console.log(fs.readFileSync("run.log", "utf-8"));
            return exitCode;
        });
    }
}
exports.Unity = Unity;
