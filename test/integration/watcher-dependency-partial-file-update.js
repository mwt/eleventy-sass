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
  dir = createProject("watcher-dependency-partial-file-update");
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

  await setTimeout(300);
  let colorsSCSS = path.join(dir, "_includes", "colors.scss");
  fs.writeFile(colorsSCSS, "$background: blue;"); 

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
  let styleCSS = await fs.readFile(path.join(dir, "_site/stylesheets/style.css"), { encoding: "utf8" });
  t.is(styleCSS, "header{background-color:pink}body{background-color:blue}");
});

}
