import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const children = [
  spawn(process.execPath, ["server.js"], {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "development",
      PORT: process.env.PORT || "8787",
    },
  }),
  spawn(process.execPath, ["./node_modules/vite/bin/vite.js"], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  }),
];

let shuttingDown = false;

for (const child of children) {
  child.on("exit", (code) => {
    if (shuttingDown) return;
    shuttingDown = true;

    for (const otherChild of children) {
      if (otherChild.pid && !otherChild.killed) {
        otherChild.kill("SIGTERM");
      }
    }

    process.exitCode = code ?? 0;
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;

    for (const child of children) {
      if (child.pid && !child.killed) {
        child.kill(signal);
      }
    }
  });
}
