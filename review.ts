/**
 * Review Extension (fixed for beta-2)
 *
 * Usage:
 * - `/review` - review uncommitted changes
 * - `/review --staged` - review staged (cached) changes
 * - `/review --help` - show usage help
 *
 * Note: Extensions can't run shell commands. Instead, read files and let the LLM review.
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { execSync } from "child_process";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("review", {
    description: "Review code changes (diffs, commits, PRs)",
    handler: async (args: string | undefined, ctx: ExtensionCommandContext) => {
      try {
        const input = args?.trim();

        // Show help
        if (input === "--help" || input === "-h") {
          return showHelp(pi);
        }

        let diff = "";
        let context = "";

        // Get diff based on input
        if (!input) {
          // Uncommitted changes
          diff = execSync("git diff", { encoding: "utf-8", cwd: ctx.projectRoot });
          context = "Review the following uncommitted code changes:";
        }
        else if (input === "--staged" || input === "--cached") {
          diff = execSync("git diff --staged", { encoding: "utf-8", cwd: ctx.projectRoot });
          context = "Review the following staged changes:";
        }
        else if (input.match(/github\.com\/[^/]+\/[^/]+\/pull\/\d+/)) {
          // GitHub PR URL
          const prInfo = parseGitHubPRUrl(input);
          if (prInfo) {
            try {
              diff = execSync(
                `gh pr diff ${prInfo.number} --repo ${prInfo.owner}/${prInfo.repo}`,
                { encoding: "utf-8" }
              );
              context = `Reviewing PR #${prInfo.number} from ${prInfo.owner}/${prInfo.repo}:`;
            } catch (err) {
              pi.sendUserMessage(`❌ Failed to fetch PR diff. Make sure 'gh' CLI is installed and you're authenticated.`);
              return;
            }
          } else {
            pi.sendUserMessage(`⚠️ Invalid GitHub PR URL: "${input}"`);
            return showHelp(pi);
          }
        }
        else {
          pi.sendUserMessage(`⚠️ Unknown input: "${input}"`);
          return showHelp(pi);
        }

        if (!diff.trim()) {
          pi.sendUserMessage("No changes to review.");
          return;
        }

        // Send to LLM for review
        await pi.sendLLMMessage({
          text: `${context}\n\n\`\`\`diff\n${diff}\n\`\`\`\n\nPlease review this code and provide feedback on:\n- Potential bugs or issues\n- Code quality concerns\n- Security considerations\n- Performance impacts`,
        });

      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        pi.sendUserMessage(`❌ Error: ${message}`);
      }
    },
  });
}

function parseGitHubPRUrl(url: string): { owner: string; repo: string; number: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (match) {
    return { owner: match[1], repo: match[2], number: match[3] };
  }
  return null;
}

function showHelp(pi: ExtensionAPI) {
  pi.sendUserMessage(`**Review Command Usage:**
\`\`\`
/review                    Review uncommitted changes
/review --staged          Review staged changes  
/review <gh-pr-url>       Review a GitHub PR (requires 'gh' CLI)
/review --help            Show this help
\`\`\`

**Examples:**
\`\`\`
/review https://github.com/owner/repo/pull/123
\`\`\``);
}
