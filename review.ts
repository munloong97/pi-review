/**
 * Review Extension - Improved
 *
 * Usage:
 * - `/review` - review uncommitted changes
 * - `/review --staged` - review staged (cached) changes
 * - `/review <commit-sha>` - review a specific commit
 * - `/review <branch-a>..<branch-b>` - compare branches
 * - `/review <pr-url>` - review GitHub PR diff
 * - `/review --help` - show usage help
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";

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

        // No input: review uncommitted changes
        if (!input) {
          await pi.runCommand("git diff");
        }
        // Staged changes
        else if (input === "--staged" || input === "--cached") {
          await pi.runCommand("git diff --staged");
        }
        // PR URL
        else if (input.startsWith("http")) {
          const prNumber = extractPRNumber(input);
          if (prNumber) {
            await pi.runCommand(`gh pr diff ${prNumber}`);
          } else {
            pi.sendUserMessage(`⚠️ Could not extract PR number from: ${input}`);
            showHelp(pi);
          }
        }
        // Commit SHA (7-40 hex chars)
        else if (isValidCommitSHA(input)) {
          await pi.runCommand(`git show ${input}`);
        }
        // Branch comparison (contains ..)
        else if (input.includes("..")) {
          await pi.runCommand(`git diff ${input}`);
        }
        // Branch name (single branch)
        else if (isValidBranchName(input)) {
          await pi.runCommand(`git diff ${input}...HEAD`);
        }
        // Unknown input
        else {
          pi.sendUserMessage(`⚠️ Unknown input: "${input}"`);
          showHelp(pi);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        pi.sendUserMessage(`❌ Error: ${message}`);
      }
    },
  });
}

/**
 * Display help message with usage examples
 */
function showHelp(pi: ExtensionAPI) {
  pi.sendUserMessage(`**Review Command Usage:**
\`\`\`
/review                    Show uncommitted changes
/review --staged          Show staged changes
/review --cached          Alias for --staged
/review <commit-sha>      Show specific commit (e.g., abc1234)
/review <branch>..<branch> Compare two branches (e.g., main..feature)
/review <pr-url>          Show GitHub PR diff
/review --help            Show this help message
\`\`\``);
}

/**
 * Extract PR number from GitHub URL
 * Supports: https://github.com/owner/repo/pull/123
 */
function extractPRNumber(url: string): string | undefined {
  const match = url.match(/\/pull\/(\d+)/);
  return match?.[1];
}

/**
 * Validate commit SHA (7-40 hexadecimal characters)
 */
function isValidCommitSHA(input: string): boolean {
  return /^[a-f0-9]{7,40}$/i.test(input);
}

/**
 * Basic validation for branch names
 * Allows: alphanumeric, -, _, ., /
 * Disallows: .., ~, ^, :, \, space, tab
 */
function isValidBranchName(input: string): boolean {
  // Basic check - avoid obviously invalid characters
  if (/[.]{2}|[~^:\s\\]/.test(input)) return false;
  // Must have at least one non-special character
  return /[a-zA-Z0-9]/.test(input);
}
