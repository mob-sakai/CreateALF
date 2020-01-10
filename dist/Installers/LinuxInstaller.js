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
const exec_1 = require("@actions/exec");
const cp = __importStar(require("child_process"));
const cacheHttpClient_1 = require("../cacheHttpClient");
const io = __importStar(require("@actions/io"));
const HttpClient_1 = require("typed-rest-client/HttpClient");
const fs = __importStar(require("fs"));
const core_1 = require("@actions/core");
const cache_version_1 = require("./cache_version");
class LinuxInstaller {
    constructor() {
        this.key = 'll';
    }
    GetPlatform() {
        return "LINUX";
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
    ;
    ExecuteSetUp(version, option) {
        return __awaiter(this, void 0, void 0, function* () {
            const inst_dep = core_1.getInput('install-dependencies', { required: false });
            if (!inst_dep || inst_dep == 'true') {
                yield this.InstallDependencies();
            }
            if (core_1.getInput('enable-cache', { required: false }) == 'true') {
                if (yield this.TryRestore(version)) {
                    return;
                }
                yield this.Install(version, option);
                yield this.TrySave(version);
            }
            else {
                yield this.Install(version, option);
            }
        });
    }
    ;
    InstallDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            yield exec_1.exec('sudo apt-get update');
            cp.execSync('sudo apt-get -y install gconf-service');
            cp.execSync('sudo apt-get -y install lib32gcc1');
            cp.execSync('sudo apt-get -y install lib32stdc++6');
            cp.execSync('sudo apt-get -y install libasound2');
            cp.execSync('sudo apt-get -y install libc6');
            cp.execSync('sudo apt-get -y install libc6-i386');
            cp.execSync('sudo apt-get -y install libcairo2');
            cp.execSync('sudo apt-get -y install libcap2');
            cp.execSync('sudo apt-get -y install libcups2');
            cp.execSync('sudo apt-get -y install libdbus-1-3');
            cp.execSync('sudo apt-get -y install libexpat1');
            cp.execSync('sudo apt-get -y install libfontconfig1');
            cp.execSync('sudo apt-get -y install libfreetype6');
            cp.execSync('sudo apt-get -y install libgcc1');
            cp.execSync('sudo apt-get -y install libgconf-2-4');
            cp.execSync('sudo apt-get -y install libgdk-pixbuf2.0-0');
            cp.execSync('sudo apt-get -y install libgl1-mesa-glx');
            cp.execSync('sudo apt-get -y install libglib2.0-0');
            cp.execSync('sudo apt-get -y install libglu1-mesa');
            cp.execSync('sudo apt-get -y install libgtk2.0-0');
            cp.execSync('sudo apt-get -y install libnspr4');
            cp.execSync('sudo apt-get -y install libnss3');
            cp.execSync('sudo apt-get -y install libpango1.0-0');
            cp.execSync('sudo apt-get -y install libstdc++6');
            cp.execSync('sudo apt-get -y install libx11-6');
            cp.execSync('sudo apt-get -y install libxcomposite1');
            cp.execSync('sudo apt-get -y install libxcursor1');
            cp.execSync('sudo apt-get -y install libxdamage1');
            cp.execSync('sudo apt-get -y install libxext6');
            cp.execSync('sudo apt-get -y install libxfixes3');
            cp.execSync('sudo apt-get -y install libxi6');
            cp.execSync('sudo apt-get -y install libxrandr2');
            cp.execSync('sudo apt-get -y install libxrender1');
            cp.execSync('sudo apt-get -y install libxtst6');
            cp.execSync('sudo apt-get -y install zlib1g');
            cp.execSync('sudo apt-get -y install npm');
            cp.execSync('sudo apt-get -y install debconf');
            //cp.execSync('sudo apt-get -y install libpq5');
        });
    }
    ;
    Install(version, option) {
        return __awaiter(this, void 0, void 0, function* () {
            const download_url = "https://beta.unity3d.com/download/" + utility_1.GetId(version) + "/UnitySetup";
            yield exec_1.exec('wget ' + download_url + ' -O UnitySetUp');
            yield exec_1.exec('sudo chmod +x UnitySetUp');
            let command = this.CreateInstallCommand(option);
            cp.execSync(command);
        });
    }
    ;
    CreateInstallCommand(option) {
        let command = 'echo y | ./UnitySetUp --unattended --install-location="/opt/Unity" --components="Unity';
        if (option["has-android"] === 'true') {
            command += ',Android';
        }
        if (option["has-il2cpp"] === 'true') {
            command += ',Linux-IL2CPP';
        }
        if (option["has-ios"] === 'true') {
            command += ',iOS';
        }
        if (option["has-mac-mono"] === 'true') {
            command += ',Mac-Mono';
        }
        if (option["has-webgl"] === 'true') {
            command += ',WebGL';
        }
        if (option["has-windows-mono"] === 'true') {
            command += ',Windows-Mono';
        }
        command += '"';
        return command;
    }
    TryRestore(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const mkdirPromise = io.mkdirP('/opt/Unity/');
            try {
                const cacheEntry = yield cacheHttpClient_1.getCacheEntry([cache_version_1.GetCacheKeyCount(this.key, version)]);
                if (!cacheEntry) {
                    return false;
                }
                const httpClient = new HttpClient_1.HttpClient("actions/cache");
                const split_count = Number.parseInt(yield (yield httpClient.get(cacheEntry.archiveLocation)).readBody());
                const archiveFilePromises = new Array(split_count);
                yield mkdirPromise;
                for (let index = 0; index < split_count; index++) {
                    const entryPromise = cacheHttpClient_1.getCacheEntry([cache_version_1.GetCacheKeyVersionIndex(this.key, version, index)]);
                    archiveFilePromises[index] = entryPromise.then((entry) => __awaiter(this, void 0, void 0, function* () {
                        if (!entry)
                            throw "null entry";
                        return yield cacheHttpClient_1.downloadCache(entry, 'unity.tar.7z' + index);
                    }));
                }
                Promise.all(archiveFilePromises);
            }
            catch (error) {
                return false;
            }
            cp.execSync('cat unity.tar.7z* > all.tar.7z');
            yield exec_1.exec('7z x all.tar.7z -o/opt/Unity/all.tar');
            cp.execSync('cd /opt/Unity/ && tar xf all.tar');
            yield exec_1.exec('rm -f unity.tar.7z* all.tar.7z /opt/Unity/all.tar');
            // cp.execSync('rm -rf /opt/Unity/ && mv -T /opt/Unity-' + version + ' /opt/Unity/');
            return true;
        });
    }
    ;
    TrySave(version) {
        return __awaiter(this, void 0, void 0, function* () {
            cp.execSync('cd /opt/Unity/ && tar cf unity.tar *');
            yield exec_1.exec('mv -f /opt/Unity/unity.tar ./unity.tar');
            yield exec_1.exec('7z a unity.tar.7z unity.tar');
            const tar7z = fs.statSync('unity.tar.7z');
            const splitSize = 1024 * 1024 * 400;
            const split_count = Math.ceil(tar7z.size / splitSize);
            const promises = new Array(split_count + 1);
            cp.execSync('echo -n ' + split_count + ' > unitytar7zcount');
            promises[split_count] = cacheHttpClient_1.saveCache(fs.createReadStream('unitytar7zcount'), cache_version_1.GetCacheKeyCount(this.key, version));
            for (let index = 0; index < split_count; index++) {
                const stream = fs.createReadStream('unity.tar.7z', {
                    start: index * splitSize,
                    end: (index + 1) * splitSize - 1,
                });
                promises[index] = cacheHttpClient_1.saveCache(stream, cache_version_1.GetCacheKeyVersionIndex(this.key, version, index));
            }
            core_1.info('Issue all save cache');
            return Promise.all(promises).then((_) => __awaiter(this, void 0, void 0, function* () {
                yield exec_1.exec('rm -f unity.tar.7z unity.tar unitytar7zcount');
            }));
        });
    }
}
exports.LinuxInstaller = LinuxInstaller;
