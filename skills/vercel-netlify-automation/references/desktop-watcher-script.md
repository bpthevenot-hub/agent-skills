---
title: Auto-Commit and Push on Local File Change
impact: MEDIUM
impactDescription: Reproduces a drag-and-drop deploy experience
tags: watcher, chokidar, fswatch, inotify, git-hooks
---

## Auto-Commit and Push on Local File Change

To reproduce a "Desktop-like" experience where dropping a file into a folder triggers a deploy, run a local watcher that commits and pushes on change.

**Incorrect (manual `git add / commit / push` every time):**

Slow, error-prone, and defeats the "just drop the file" goal.

**Correct (Node watcher with `chokidar`):**

```js
// watch.js
const chokidar = require("chokidar");
const { execSync } = require("child_process");

let timer;
chokidar.watch(".", { ignored: /(^|[/\\])\.|node_modules|dist/ })
  .on("all", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        execSync("git add -A", { stdio: "inherit" });
        execSync(`git commit -m "auto: $(date -Iseconds)"`, { stdio: "inherit" });
        execSync("git push", { stdio: "inherit" });
      } catch (e) {
        // ignore "nothing to commit"
      }
    }, 2000); // debounce 2s
  });
```

Run with `node watch.js`. Push triggers Vercel/Netlify auto-deploys.

Cross-platform alternatives:
- macOS/Linux: `fswatch -o . | xargs -n1 -I{} ./push.sh`
- Linux: `inotifywait -m -r -e modify,create,delete .`
- Any OS: **GitHub Desktop** for a GUI commit/push flow.

For static-only sites, skip Git entirely and call the CLI directly:

```bash
vercel deploy --prod --token=$VERCEL_TOKEN
netlify deploy --prod --dir=./public --auth=$NETLIFY_AUTH_TOKEN
```
