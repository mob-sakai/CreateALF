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
const unity_1 = require("./unity");
const utility = __importStar(require("./utility"));
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const version = core.getInput("unity-version", { required: true });
        const modules = core.getInput("unity-modules", { required: false });
        const project_path = core.getInput("project-path", { required: false });
        const args = core.getInput("args", { required: false });
        const secrets = JSON.parse(core.getInput("secrets", { required: true }));
        const ulfKey = `ULF_${utility.getPlatform()}_${version.split(".")[0]}`;
        const ulf = secrets[ulfKey];
        const username = secrets["UNITY_USERNAME"];
        const password = secrets["UNITY_PASSWORD"];
        const unity = new unity_1.Unity(version, modules);
        unity.username = username;
        unity.password = password;
        yield unity.install();
        if (yield unity.activate(ulf)) {
            const exitCode = yield unity.run(project_path, args);
            if (exitCode != 0)
                core.setFailed(`Unity failed with exit code ${exitCode}`);
        }
        else {
            const alf = yield unity.createAlf();
            const token = secrets["GITHUB_TOKEN"];
            const res = yield createAlfIssue(alf, version, ulfKey, token);
            const message = `Secret '${ulfKey}' is not available. For detail, see ${res.data.url}`;
            core.setFailed(message);
        }
    });
}
function createAlfIssue(alf, version, ulfKey, token) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const alfName = `Unity_v${version}.alf`;
        const ulfName = `Unity_v${version.split(".")[0]}.x.ulf`;
        const title = `[Actions] Secret '${ulfKey}' has been requested by workflow '${github.context.workflow}'`;
        const body = `### Follow the instructions below to set up secret \`${ulfKey}\`.

1. Save the following text as \`${alfName}\`.  
\`\`\`
${alf}
\`\`\`
2. Activate \`${alfName}\` on the following page and download \`${ulfName}\`.  
https://license.unity3d.com/manual
3. Add/update the contents of \`${ulfName}\` as secret \`${ulfKey}\`.  
${(_a = github.context.payload.repository) === null || _a === void 0 ? void 0 : _a.html_url}/settings/secrets`;
        return utility.createIssue(title, body, token);
    });
}
run();
