"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const github = __importStar(require("@actions/github"));
function getPlatform() {
    switch (process.platform) {
        case "darwin":
            return "OSX";
        case "win32":
            return "WIN";
        default:
            return "LINUX";
    }
}
exports.getPlatform = getPlatform;
function createIssue(title, body, token) {
    return new github.GitHub(token || "").issues.create(Object.assign(Object.assign({}, github.context.repo), { title,
        body }));
}
exports.createIssue = createIssue;
