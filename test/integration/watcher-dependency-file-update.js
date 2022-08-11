if (parseInt(process.version.match(/^v(\d+)/)[1]) < 16) {
  const test = require("ava");
  test("test doesn't support node version < 16", async t => {
    t.pass();
  });
} else {

const util = require("util");
const exec = util.promisify(require("child_process").exec);
const path = require("path");
const { promises: fs } = require("fs");
const { setTimeout } = require("timers/promises");

const test = require("ava");
const Semaphore = require("@debonet/es6semaphore");

const createProject = require("./_create-project2");
let dir;

test.before(async t => {
  let sem = new Semaphore(1);
  await sem.wait();
  dir = createProject("watcher-dependency-file-update");
  let elev = exec("npx @11ty/eleventy --watch", { cwd: dir });
  elev.child.on("close", (code) => {
    console.error("closing");
    sem.signal();
  });
  elev.child.stdout.on("data", function(data) {
    console.error("stdout: " + data);
    if (data.trim() === "[11ty] Watching…")
      sem.signal();
  });
  await sem.wait();

  await setTimeout(1000);
  let headerSCSS = path.join(dir, "stylesheets", "header.scss");
  fs.writeFile(headerSCSS, `header {
    background-color: red;
  }`); 

  await sem.wait();

  elev.child.kill("SIGINT");
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
  t.is(styleCSS, "header{background-color:red}body{background-color:red}");

  let headerPath = path.join(dir, "_site", "stylesheets", "header.css");
  let headerCSS = await fs.readFile(headerPath, { encoding: "utf8" });
  t.is(headerCSS, "header{background-color:red}");
});

}
