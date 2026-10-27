import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = path.resolve("out");
const output = path.join(root, "p2p-manifest.json");

const allowed = new Set([
  ".html", ".txt", ".js", ".css", ".json", ".svg",
  ".png", ".jpg", ".jpeg", ".webp", ".avif",
  ".ico", ".woff", ".woff2", ".ttf", ".otf"
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }

  return files;
}

const files = await walk(root);
const resources = [];

for (const file of files) {
  if (file === output) continue;

  const relative = path.relative(root, file).split(path.sep).join("/");
  const extension = path.extname(file).toLowerCase();

  if (!allowed.has(extension) || relative.endsWith(".map")) continue;

  const info = await stat(file);
  if (info.size > 50 * 1024 * 1024) continue;

  const data = await readFile(file);
  resources.push({
    path: "/" + relative,
    size: data.length,
    sha256: createHash("sha256").update(data).digest("hex")
  });
}

resources.sort((a, b) => a.path.localeCompare(b.path));

await writeFile(
  output,
  JSON.stringify({
    version: 1,
    generatedAt: new Date().toISOString(),
    resources
  }, null, 2) + "\n"
);

console.log(`Manifiesto P2P: ${resources.length} recursos públicos.`);
console.log(`Archivo: ${output}`);
