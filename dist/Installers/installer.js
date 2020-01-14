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
const LinuxInstaller_1 = require("./LinuxInstaller");
const WindowsInstaller_1 = require("./WindowsInstaller");
const MacOSInstaller_1 = require("./MacOSInstaller");
const tc = __importStar(require("@actions/tool-cache"));
function CreateInstaller() {
    switch (process.platform) {
        case "darwin":
            return new MacOSInstaller_1.MacOSInstaller();
        case "win32":
            return new WindowsInstaller_1.WindowsInstaller();
        default:
            return new LinuxInstaller_1.LinuxInstaller();
    }
}
exports.CreateInstaller = CreateInstaller;
function findRubyVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const versions = tc.findAllVersions("Ruby");
        console.log("Ruby");
        console.log(versions);
        // const installDir: string | null = tc.find("Ruby", version);
        // if (!installDir) {
        //   throw new Error(`Version ${version} not found`);
        // }
        // const toolPath: string = path.join(installDir, "bin");
        // core.addPath(toolPath);
    });
}
exports.findRubyVersion = findRubyVersion;
function findU3d() {
    return __awaiter(this, void 0, void 0, function* () {
        const versions = tc.findAllVersions("u3d");
        console.log("u3d");
        console.log(versions);
        // if (!installDir) {
        //   throw new Error(`Version ${version} not found`);
        // }
        // const toolPath: string = path.join(installDir, "bin");
        // core.addPath(toolPath);
    });
}
exports.findU3d = findU3d;
