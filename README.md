# pi-review-ext

A Pi extension that adds a `/review` command for reviewing code changes.

## Features

- `/review` - Review uncommitted changes (shows `git diff`)
- `/review <commit-sha>` - Review a specific commit
- `/review <pr-url>` - Review a GitHub PR (requires `gh` CLI)

## Usage

Install the extension:

```bash
ln -s ~/pi-extensions/pi-review-ext ~/.pi/agent/extensions/pi-review-ext
```

Then use in Pi:

```
/review          # Review current uncommitted changes
/review abc123   # Review specific commit
/review https://github.com/user/repo/pull/123  # Review GitHub PR
```