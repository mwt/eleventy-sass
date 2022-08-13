if (parseInt(process.version.match(/^v(\d+)/)[1]) < 16) {
  const test = require("ava");
  test("test doesn't support node version < 16", async t => {
    t.pass();
  });
  return;
}

// const util = require("util");
// const exec = util.promisify(require("child_process").exec);
const { spawn } = require("child_process");
const path = require("path");
const { promises: fs } = require("fs");
const { setTimeout } = require("timers/promises");

const test = require("ava");
const Semaphore = require("@debonet/es6semaphore");

const createProject = require("./_create-project2");
let dir;
let proc;

test.after.always("cleanup child process", t => {
  if (proc && !proc.killed)
    proc.kill();
});

test.before(async t => {
  let sem = new Semaphore(1);
  await sem.wait();
  dir = createProject("watcher-adding-to-dependencies");
  proc = spawn("npx", ["@11ty/eleventy", "--watch"], { cwd: dir, timeout: 5000 });
  proc.on("close", (code) => {
    console.error("closing");
    sem.signal();
  });
  proc.stdout.on("data", function(data) {
    console.error("stdout: " + data);
    let str = data.toString();
    if (str.trim() === "[11ty] Watching…")
      sem.signal();
  });
  await sem.wait();
  await setTimeout(300);

  let styleSCSS = path.join(dir, "stylesheets", "style.scss");
  fs.writeFile(styleSCSS, `@use "colors";
  @use "header";
  @use "footer";

  body {
    background-color: colors.$background;
  }`);

  await sem.wait();
  await setTimeout(300);

  proc.kill();
  await sem.wait();
});

test("write CSS files compiled from SCSS", async t => {
  let stylesheetsDir = path.join(dir, "_site", "stylesheets");
  let csses = await fs.readdir(stylesheetsDir);
  t.deepEqual(csses, ["header.css", "style.css"]);
});


test("watcher works", async t => {
  let stylePath = path.join(dir, "_site", "stylesheets", "style.css");
  let styleCSS = await fs.readFile(stylePath, { encoding: "utf8" });
  t.is(styleCSS, "header{background-color:pink}footer{background-color:pink}body{background-color:red}");

  let headerPath = path.join(dir, "_site", "stylesheets", "header.css");
  let headerCSS = await fs.readFile(headerPath, { encoding: "utf8" });
  t.is(headerCSS, "header{background-color:pink}");
});
