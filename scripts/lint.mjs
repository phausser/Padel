import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
const ignored = new Set([".git", "build", "coverage", "dist", "node_modules"]);
const sourceExtensions = new Set([".js", ".mjs"]);
const textExtensions = new Set([".css", ".html", ".json", ".md", ".yml", ".yaml"]);
const failures = [];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignored.has(entry.name)) {
      continue;
    }

    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else {
      files.push(path);
    }
  }

  return files;
}

function runNodeCheck(file) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failures.push(`${file}\n${result.stderr.trim()}`);
  }
}

async function checkTextFile(file) {
  const content = await readFile(file, "utf8");

  if (content.includes("\t")) {
    failures.push(`${file}: tabs are not used for indentation in this project`);
  }

  if (!content.endsWith("\n")) {
    failures.push(`${file}: missing trailing newline`);
  }

  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (/[ \t]$/.test(line)) {
      failures.push(`${file}:${index + 1}: trailing whitespace`);
    }
  });
}

const files = await collectFiles(root);

for (const file of files) {
  const extension = extname(file);

  if (sourceExtensions.has(extension)) {
    runNodeCheck(file);
  }

  if (sourceExtensions.has(extension) || textExtensions.has(extension)) {
    await checkTextFile(file);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`Linted ${files.length} files.`);
