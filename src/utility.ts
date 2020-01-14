import * as github from "@actions/github";

export function getPlatform(): string {
  switch (process.platform) {
    case "darwin":
      return "OSX";
    case "win32":
      return "WIN";
    default:
      return "LINUX";
  }
}

export function createIssue(title: string, body: string, token: string) {
  return new github.GitHub(token || "").issues.create({
    ...github.context.repo,
    title,
    body
  });
}
