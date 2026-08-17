#!/usr/bin/env node
/**
 * npm runs before next.config.mjs is evaluated, so the port would otherwise have
 * to be hardcoded in package.json. This shim loads the root .env first, then
 * hands off to the Next.js CLI with the port from FRONTEND_PORT.
 *
 *   node scripts/next-with-env.mjs dev|start
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../.env") });

const command = process.argv[2] ?? "dev";
const port = process.env.FRONTEND_PORT || process.env.PORT || "3000";

const child = spawn(
  process.execPath,
  [path.resolve(here, "../node_modules/next/dist/bin/next"), command, "-p", port],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
