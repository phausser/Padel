import { copyFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const outputDirectory = "dist";
const files = ["index.html", "style.css", "game.js"];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  files.map((file) => copyFile(file, join(outputDirectory, file)))
);

console.log(`Built ${files.length} files into ${outputDirectory}/.`);
