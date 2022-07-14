const { execSync } = require("child_process");
const path = require("path");
const { promises: fs } = require("fs");
const { createHash } = require("crypto");
const test = require("ava");
const createProject = require("./_create-project");
let dir;
let cssContent = "body{color:red}";
let revHash = createHash("md5").update(cssContent).digest("hex").slice(0, 8);

test.serial.before(t => {
  dir = createProject("rev-with-permalink-function-that-returns-string");
  execSync("npx @11ty/eleventy --config=config-with-permalink-function-that-returns-string.js", { cwd: dir });
});

test("create css file with rev hash", async t => {
  await t.notThrowsAsync(async () => await fs.access(path.join(dir, `_site/css/style-${ revHash }.css`)));
});

test("rev filter", async t => {
  let content = await fs.readFile(path.join(dir, "_site/css-style-css--rev/index.html"), { encoding: "utf8" });
  t.is(content, `<p>/css/style-${ revHash }.css</p>\n`);
});

test("inputToRevvedOutput filter", async t => {
  let content = await fs.readFile(path.join(dir, "_site/stylesheets-style-scss--input-to-revved-output/index.html"), { encoding: "utf8" });
  t.is(content, `<p>/css/style-${ revHash }.css</p>\n`);
});
