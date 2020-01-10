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
const utility_1 = require("../utility");
// import { execSync } from 'child_process';
const exec_1 = require("@actions/exec");
const core_1 = require("@actions/core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class WindowsInstaller {
    GetPlatform() {
        return "WIN";
    }
    GetId(version) {
        if (this.version === version) {
            if (this.id)
                return this.id;
            return this.id = utility_1.GetId(version);
        }
        this.version = version;
        return this.id = utility_1.GetId(version);
    }
    ExecuteSetUp(version, option) {
        return __awaiter(this, void 0, void 0, function* () {
            const download_url = "https://beta.unity3d.com/download/" + utility_1.GetId(version) + "/Windows64EditorInstaller/UnitySetup64.exe";
            const download_path = path.resolve('UnitySetup64.exe');
            const exec_opt = { failOnStdErr: false, ignoreReturnCode: true, windowsVerbatimArguments: true };
            const unity = '"C:\\Program Files\\Unity\\Editor\\Unity.exe"';
            console.log(`**** Download installer`);
            yield exec_1.exec(`bitsadmin /TRANSFER dlinstaller /download /priority foreground ${download_url} "${download_path}"`);
            console.log(`**** Install`);
            yield exec_1.exec('UnitySetup64.exe /UI=reduced /S');
            console.log(`**** Activate with ulf`);
            fs.writeFileSync('.ulf', option.ulf || '');
            const code = yield exec_1.exec(`${unity} -quit -batchMode -nographics -logfile .log -manualLicenseFile .ulf`, [], exec_opt);
            console.log(`manualLicenseFile ${code}`);
            console.log(fs.readFileSync('.log', 'utf-8'));
            const actcode = yield exec_1.exec(`${unity} -quit -batchMode -nographics -logfile .log -createManualActivationFile`, [], exec_opt);
            const alf = `Unity_${version}.alf`;
            console.log(fs.readFileSync('.log', 'utf-8'));
            console.log(`createManualActivationFile ${actcode} ${alf}`);
            // console.log(`createManualActivationFile ${fs.readFileSync(alf, 'utf-8')}`);
            if (option.ulf) {
                // writeFileSync('.ulf', option.ulf);
                // const ret = await exec('C:\\Program Files\\Unity\\Editor\\Unity.exe -quit -batchMode -nographics -logfile -manualLicenseFile .ulf');
            }
            else {
                console.log(`**** Create activation file`);
                core_1.setFailed(`Secret '${option.ulfKey}' is undefined.`);
            }
            // なんてことだ！
            // 信じられない！
            // 上記のInvoke-WebRequestにすると2018.3.7f1をダウンロードしてくるのだ。
            // Unity2020を要求しているのにも関わらず！
            // しょうがないからbitsadminする他無い！            
            // execSync('bitsadmin /TRANSFER bj /download /priority foreground ' + download_url + ' %CD%\\UnitySetup64.exe');
            // execSync('UnitySetup64.exe /UI=reduced /S /D=C:\\Program Files\\Unity');
        });
    }
}
exports.WindowsInstaller = WindowsInstaller;
