import { Installer, InstallOption } from './installer_definition';
import { GetId } from '../utility';
// import { execSync } from 'child_process';
import { exec } from '@actions/exec';
import { setFailed } from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';


export class WindowsInstaller implements Installer {
    version: string | undefined;
    id: string | undefined;
    GetPlatform(): string {
        return "WIN";
    }
    GetId(version: string): string {
        if (this.version === version) {
            if (this.id)
                return this.id;
            return this.id = GetId(version);
        }
        this.version = version;
        return this.id = GetId(version);
    }
    async ExecuteSetUp(version: string, option: InstallOption): Promise<void> {
        const download_url = "https://beta.unity3d.com/download/" + GetId(version) + "/Windows64EditorInstaller/UnitySetup64.exe"
        const download_path = path.resolve('UnitySetup64.exe');
        const exec_opt = {failOnStdErr: false, ignoreReturnCode: true, windowsVerbatimArguments: true}
        const unity = '"C:\\Program Files\\Unity\\Editor\\Unity.exe"';

        console.log(`**** Download installer`);
        await exec(`bitsadmin /TRANSFER dlinstaller /download /priority foreground ${download_url} "${download_path}"`);
        
        console.log(`**** Install`);
        await exec('UnitySetup64.exe /UI=reduced /S');

        console.log(`**** Activate with ulf`);
        fs.writeFileSync('.ulf', option.ulf || '');
        const code = await exec(`${unity} -quit -batchMode -nographics -logfile .log -manualLicenseFile .ulf`, [], exec_opt);
        console.log(`manualLicenseFile ${code}`);
        console.log(fs.readFileSync('.log', 'utf-8'));

        const actcode = await exec(`${unity} -quit -batchMode -nographics -logfile .log -createManualActivationFile`, [], exec_opt);
        const alf = `Unity_${version}.alf`
        console.log(fs.readFileSync('.log', 'utf-8'));
        console.log(`createManualActivationFile ${actcode} ${alf}`);
        // console.log(`createManualActivationFile ${fs.readFileSync(alf, 'utf-8')}`);

        if(option.ulf)
        {
            // writeFileSync('.ulf', option.ulf);
            // const ret = await exec('C:\\Program Files\\Unity\\Editor\\Unity.exe -quit -batchMode -nographics -logfile -manualLicenseFile .ulf');


        }
        else
        {
        console.log(`**** Create activation file`);
        setFailed(`Secret '${option.ulfKey}' is undefined.`);

        }

        // なんてことだ！
        // 信じられない！
        // 上記のInvoke-WebRequestにすると2018.3.7f1をダウンロードしてくるのだ。
        // Unity2020を要求しているのにも関わらず！
        // しょうがないからbitsadminする他無い！            
        // execSync('bitsadmin /TRANSFER bj /download /priority foreground ' + download_url + ' %CD%\\UnitySetup64.exe');
        // execSync('UnitySetup64.exe /UI=reduced /S /D=C:\\Program Files\\Unity');
    }
}