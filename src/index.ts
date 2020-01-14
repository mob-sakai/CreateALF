import { Unity } from "./unity";
import * as utility from "./utility";
import * as core from "@actions/core";
import * as github from "@actions/github";

async function Run() {
  const version_ = "2018.3.11f1";
  const modules = "";
  const project_path = ".";
  const args = "";

  const secrets = JSON.parse(core.getInput("secrets", { required: true }));
  const ulfSecret = `UNITY_${utility.getPlatform()}_${version_.split(".")[0]}`;
  const ulf = secrets[ulfSecret];

  const unity = new Unity(version_, modules);
  await unity.install();
  if (await unity.activate(ulf)) {
    await unity.run(project_path, args);
    await unity.deactivate();
  } else {
    const alf = await unity.createAlf();
    const token = secrets["GITHUB_TOKEN"];
    const res = await createAlfIssue(alf, version_, ulfSecret, token);
    const message = `Secret '${ulfSecret}' is not available. For detail, see ${res.data.url}`;
    core.setFailed(message);
  }

  async function createAlfIssue(
    alf: string,
    version: string,
    ulfSecret: string,
    token: string
  ) {
    const alfName = `Unity_v${version}.alf`;
    const ulfName = `Unity_v${version.split(".")[0]}.x.ulf`;
    const title = `[Actions] Secret '${ulfSecret}' has been requested by workflow '${github.context.workflow}'`;
    const body = `### Follow the instructions below to set up secret \`${ulfSecret}\`.

1. Save the following text as \`${alfName}\`.  
\`\`\`
${alf}
\`\`\`
2. Activate \`${alfName}\` on the following page and download \`${ulfName}\`.  
https://license.unity3d.com/manual
3. Add/update the contents of \`${ulfName}\` as secret \`${ulfSecret}\`.  
${github.context.payload.repository?.html_url}/settings/secrets`;
    return utility.createIssue(title, body, token);
  }
}

Run();
