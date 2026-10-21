import { spawn } from "node:child_process";

// Build the static site with the same base path used by GitHub Pages. Keeping
// this in a script makes the export check runnable locally and in CI without
// relying on shell-specific environment-variable syntax.
const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(command, ["exec", "next", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    GITHUB_PAGES: "true",
    PAGES_BASE_PATH: process.env.PAGES_BASE_PATH || "/process-mapper",
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || "https://gerrcass.github.io/process-mapper",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
