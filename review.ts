/**
 * Simple Review Extension
 *
 * Usage:
 * - `/review` - review uncommitted changes
 * - `/review <commit-sha>` - review a specific commit
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("review", {
    description: "Review code changes",
    handler: async (args: string | undefined, ctx: ExtensionCommandContext) => {
      const input = args?.trim();

      if (!input) {
        pi.runCommand("git diff");
      } else if (input.startsWith("http")) {
        const prNumber = input.match(/\/pull\/(\d+)/)?.[1];
        if (prNumber) {
          pi.runCommand(`gh pr diff ${prNumber}`);
        } else {
          pi.sendUserMessage(`Review PR: ${input}`);
        }
      } else {
        pi.runCommand(`git show ${input}`);
      }
    },
  });
}
