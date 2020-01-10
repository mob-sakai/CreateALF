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
    
    async Execute(args: string): Promise<number> {
        const unity = '"C:\\Program Files\\Unity\\Editor\\Unity.exe"';
        const exec_opt = {failOnStdErr: false, ignoreReturnCode: true, windowsVerbatimArguments: true}

        // Install
        if(!fs.existsSync(unity))
        {
            const download_url = "https://beta.unity3d.com/download/" + GetId(this.version || '') + "/Windows64EditorInstaller/UnitySetup64.exe"
            const download_path = path.resolve('UnitySetup64.exe');

            console.log(`**** Download Installer for Unity ${this.version}`);
            await exec(`bitsadmin /TRANSFER dlinstaller /download /priority foreground ${download_url} ${download_path}`);
            
            console.log(`**** Install Unity`);
            await exec('UnitySetup64.exe /UI=reduced /S');
        }

        // Execute
        const code = await exec(`${unity} -logFile .log ` + args, [], exec_opt);
        if(fs.existsSync('.log'))
            console.log(fs.readFileSync('.log', 'utf-8'));

        return code;
    }

    async CreateAlf(version: string): Promise<void> {
        // const unity = '"C:\\Program Files\\Unity\\Editor\\Unity.exe"';
        // const exec_opt = {failOnStdErr: false, ignoreReturnCode: true, windowsVerbatimArguments: true}

        // const alf = `Unity_v${version}.alf`
        console.log(`**** Create activation file`);
        await this.Execute('-quit -batchMode -nographics -createManualActivationFile');


        // await exec(`${unity} -quit -batchMode -nographics -logfile -createManualActivationFile`, [], exec_opt);
        // const alf = `Unity_v${version}.alf`
        // console.log(fs.readFileSync('.log', 'utf-8'));
        console.log('---- ここから ----');
        console.log(fs.readFileSync(`Unity_v${version}.alf`, 'utf-8'));
        console.log('---- ここまで ----');

        console.warn(`ULFを設定してください`);
        console.warn(`設定方法`);
        console.warn(`なんやかんや`);
    }



    async ExecuteSetUp(version: string, option: InstallOption): Promise<void> {
        // const download_url = "https://beta.unity3d.com/download/" + GetId(version) + "/Windows64EditorInstaller/UnitySetup64.exe"
        // const download_path = path.resolve('UnitySetup64.exe');
        // const unity = '"C:\\Program Files\\Unity\\Editor\\Unity.exe"';
        // const exec_opt = {failOnStdErr: false, ignoreReturnCode: true, windowsVerbatimArguments: true}
        // const unity = '"C:\\Program Files\\Unity\\Editor\\Unity.exe"';

        // if(!fs.existsSync(unity))
        // {
        //     console.log(`**** Download installer`);
        //     await exec(`bitsadmin /TRANSFER dlinstaller /download /priority foreground ${download_url} ${download_path}`);
            
        //     console.log(`**** Install`);
        //     await exec('UnitySetup64.exe /UI=reduced /S');
        // }

        if(!option.ulf)
        {
            setFailed(`Secret '${option.ulfKey}' is undefined.`);
            await this.CreateAlf(version);
            return;
        }
        
        console.log(`**** Activate with ulf`);
        fs.writeFileSync('.ulf', option.ulf || '', 'utf-8');
        const code = await this.Execute('-quit -batchMode -nographics -manualLicenseFile .ulf');
        console.log(code);

        // fs.writeFileSync('.ulf', option.ulf || '');
        // const activate_code = await exec(`${unity} -quit -batchMode -nographics -logfile .log -manualLicenseFile .ulf`, [], exec_opt);
        // console.log(fs.readFileSync('.log', 'utf-8'));

        if(code != 0)
        {
            setFailed(`Secret '${option.ulfKey}' is not available.`);
            await this.CreateAlf(version);
            return;
        }

        console.log("コマンドーを実行");

        // なんてことだ！
        // 信じられない！
        // 上記のInvoke-WebRequestにすると2018.3.7f1をダウンロードしてくるのだ。
        // Unity2020を要求しているのにも関わらず！
        // しょうがないからbitsadminする他無い！            
        // execSync('bitsadmin /TRANSFER bj /download /priority foreground ' + download_url + ' %CD%\\UnitySetup64.exe');
        // execSync('UnitySetup64.exe /UI=reduced /S /D=C:\\Program Files\\Unity');
    }
}