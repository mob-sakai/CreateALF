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
    });
}
function findRubyVersion(version) {
    const installDir = tc.find("Ruby", version);
    if (!installDir) {
        throw new Error(`Version ${version} not found`);
    }
    const toolPath = path.join(installDir, "bin");
    core.addPath(toolPath);
}
exports.findRubyVersion = findRubyVersion;
class Inst {
    constructor(version) {
        this.gem = 'gem';
        this.u3d = 'u3d';
        this.version = version;
        if (process.platform == "win32") {
            this.gem += '.cmd';
            this.u3d += '.bat';
        }
    }
}
function gem(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const exe = process.platform == "win32" ? "gem.cmd" : "gem";
        yield exec_1.exec(`${exe} ${args}`);
    });
}
exports.gem = gem;
function u3d(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const exe = process.platform == "win32" ? "u3d.bat" : "u3d";
        yield exec_1.exec(`${exe} ${args}`);
    });
}
exports.u3d = u3d;
function installUnity(version, packages) {
    return __awaiter(this, void 0, void 0, function* () {
        yield gem(`install u3d`);
        yield gem(`which u3d`);
        yield u3d(`available`);
        yield u3d(`install ${version}`);
        yield u3d(`list`);
        if (packages)
            yield u3d(`install ${version} -p ${packages}`);
    });
}
exports.installUnity = installUnity;
function install() {
    return __awaiter(this, void 0, void 0, function* () {
        findRubyVersion("2.6.x");
        // process.env["PATH"] += `;${toolPath}`;
        // console.log(fs.existsSync(path.join(toolPath, "gem")));
        // console.log(process.env["PATH"]);
        const version = "2018.3.13f1";
        if (process.platform == "win32") {
            yield installUnity(version, 'WebGL');
            // await exec(`gem.cmd install u3d`);
            // await exec(`u3d.bat available`);
            // await exec(`u3d.bat install ${version}`);
            // await exec(`u3d.bat install ${version} -p WebGL`);
            // await exec(`u3d.bat list`);
            yield tc.cacheDir(`C:\\Program Files\\Unity_${version}`, "Unity", "2018.3.13-f1");
            console.log(tc.find("Unity", "2018.3.13-f1"));
            console.log('finish !!!');
        }
        else {
            yield exec_1.exec(`gem install u3d`);
            yield exec_1.exec(`u3d available`);
            yield exec_1.exec(`u3d install ${version}`);
            yield exec_1.exec(`u3d install ${version} -p WebGL`);
            yield exec_1.exec(`u3d list`);
            if (process.platform == "darwin")
                tc.cacheDir(`/Application/Unity_${version}`, "Unity", version);
            else
                tc.cacheDir(`/opt/unity-ediotr-${version}`, "Unity", version);
            console.log(tc.find("Unity", version));
        }
    });
}
exports.install = install;
install();
