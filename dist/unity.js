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
        this.version = version;
        this.packages = packages;
    }
    u3d(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const exe = process.platform == "win32" ? "u3d.bat" : "u3d";
            return exec.exec(`${exe} ${args}`, [], {
                failOnStdErr: false,
                ignoreReturnCode: true,
                windowsVerbatimArguments: true,
            });
        });
    }
    u3dRun(args, quit = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const q = quit ? "-quit" : "";
            return this.u3d(`-u ${this.version} -- ${q} -batchmode -nographics -logFile .log ${args}`);
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
            fs.writeFileSync(".ulf", ulf || "", "utf-8");
            yield this.u3dRun(`-manualLicenseFile .ulf -logFile .log`);
            console.log(fs.readFileSync(".log", "utf-8"));
            const log = fs.readFileSync(".log", "utf-8");
            if (!/ Next license update check is after /.test(log)) {
                return false;
            }
            console.log("マニュアルアクティベート成功");
            return true;
        });
    }
    createAlf() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("マニュアルアクティベート作成");
            yield this.u3dRun(`-createManualActivationFile -logFile .log`);
            console.log(fs.readFileSync(".log", "utf-8"));
            console.log("マニュアルアクティベート作成完了");
            return fs.readFileSync(`Unity_v${this.version}.alf`, "utf-8");
        });
    }
    run(projectPath, args) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("プロジェクト実行");
            return this.u3dRun(`-projectPath ${projectPath} ${args}`);
            // console.log("プロジェクト終了");
            // console.log(`exit code = ${code}`);
            // if (code != 0) {
            //   core.setFailed("Unity failed with exit code 1");
            // }
        });
    }
}
exports.Unity = Unity;
