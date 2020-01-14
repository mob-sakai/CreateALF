import { Unity } from "./unity";
import * as utility from "./utility";
import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  const version_ = "2018.3.11f1";
  const modules = "";
  const project_path = ".";
  const args = "";
  const secrets = JSON.parse(core.getInput("secrets", { required: true }));

  const ulfKey = `ULF_${utility.getPlatform()}_${version_.split(".")[0]}`;
  const ulf = secrets[ulfKey];

  const unity = new Unity(version_, modules);
  await unity.install();

  if (await unity.activate(ulf)) {
    const exitCode = await unity.run(project_path, args);
    if (exitCode != 0)
      core.setFailed(`Unity failed with exit code ${exitCode}`);
  } else {
    const alf = await unity.createAlf();
    const token = secrets["GITHUB_TOKEN"];
    const res = await createAlfIssue(alf, version_, ulfKey, token);
    const message = `Secret '${ulfKey}' is not available. For detail, see ${res.data.url}`;
    core.setFailed(message);
  }
}

async function createAlfIssue(
  alf: string,
  version: string,
  ulfKey: string,
  token: string
) {
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
${github.context.payload.repository?.html_url}/settings/secrets`;
  return utility.createIssue(title, body, token);
}

run();
