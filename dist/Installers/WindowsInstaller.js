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
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("../utility");
const exec_1 = require("@actions/exec");
const core_1 = require("@actions/core");
const fs_1 = require("fs");
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
            yield exec_1.exec('Invoke-WebRequest -Uri ' + download_url + ' -OutFile ./UnitySetup64.exe');
            yield exec_1.exec('UnitySetup64.exe /UI=reduced /S /D=C:\\Program Files\\Unity');
            fs_1.writeFileSync('.ulf', option.ulf || '');
            const code = yield exec_1.exec('C:\\Program Files\\Unity\\Editor\\Unity.exe -quit -batchMode -nographics -logfile .log -manualLicenseFile .ulf');
            console.log(`manualLicenseFile ${code}`);
            console.log(fs_1.readFileSync('.log'));
            const actcode = yield exec_1.exec('C:\\Program Files\\Unity\\Editor\\Unity.exe -quit -batchMode -nographics -logfile -createManualActivationFile');
            const alf = `Unity_${version}.alf`;
            console.log(`createManualActivationFile ${actcode} ${alf}`);
            console.log(`createManualActivationFile ${fs_1.readFileSync(alf)}`);
            if (option.ulf) {
                // writeFileSync('.ulf', option.ulf);
                // const ret = await exec('C:\\Program Files\\Unity\\Editor\\Unity.exe -quit -batchMode -nographics -logfile -manualLicenseFile .ulf');
            }
            else {
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
