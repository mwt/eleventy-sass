if (parseInt(process.version.match(/^v(\d+)/)[1]) < 16) {
  const test = require("ava");
  test("tests don't support node version < 16", async t => {
    t.pass();
  });
  return;
}

const { spawn } = require("child_process");
const path = require("path");
const { promises: fs } = require("fs");
const { setTimeout } = require("timers/promises");

const test = require("ava");
const Semaphore = require("@debonet/es6semaphore");

const createProject = require("./_create-project2");
let dir;
let proc;
let pid;

test.after.always("cleanup child process", t => {
  if (proc && proc.exitCode === null) {
    pid ? process.kill(pid, "SIGINT") : proc.kill();
  }
});

test.before(async t => {
  let sem = new Semaphore(1);
  await sem.wait();
  dir = createProject("watcher-dependency-file-update");
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  proc = spawn(npx, ["@11ty/eleventy", "--watch"], { cwd: dir, timeout: 20000 });
  proc.on("exit", (code, signal) => {
    console.error(`TTTTT closing code: ${ code }, signal: ${ signal }`);
    sem.signal();
  });
  proc.stdout.on("data", function(data) {
    console.error("TTTTT stdout: " + data);
    let str = data.toString();

    let match = str.match(/^Eleventy PID: (\d+)/);
    if (match) {
      pid = parseInt(match[1]);
    }

    if (str.trim() === "[11ty] Watching…") {
      console.error("TTTTT detected [11ty] Watching");
      sem.signal();
    }
  });
  proc.stderr.on("data", function(data) {
    console.error("TTTTT stderr: " + data);
  });
  await sem.wait();

  await setTimeout(300);
  let headerSCSS = path.join(dir, "stylesheets", "header.scss");
  console.error("TTTTT will update header.scss");
  fs.writeFile(headerSCSS, `header {
    background-color: red;
  }`);
  console.error("TTTTT updating header.scss");

  await sem.wait();
  console.error("TTTTT updated header.scss");
  await setTimeout(300);

  console.error("TTTTT will send SIGINT");
  if (pid && process.kill(pid, "SIGINT"))
    pid = undefined;
  console.error("TTTTT sent SIGINT");
  await sem.wait();
  console.error("TTTTT setup completed");
});

test("write CSS files compiled from SCSS", async t => {
  let stylesheetsDir = path.join(dir, "_site", "stylesheets");
  let csses = await fs.readdir(stylesheetsDir);
  t.deepEqual(csses, ["header.css", "style.css"]);
});


test("watcher works", async t => {
  let stylePath = path.join(dir, "_site", "stylesheets", "style.css");
  console.error(`TTTTT style.css path: ${ stylePath }`);
  let styleCSS = await fs.readFile(stylePath, { encoding: "utf8" });
  console.error(`TTTTT style.css : ${ styleCSS }`);
  t.is(styleCSS, "header{background-color:red}body{background-color:red}");

  let headerPath = path.join(dir, "_site", "stylesheets", "header.css");
  console.error(`TTTTT header.css path: ${ headerPath }`);
  let headerCSS = await fs.readFile(headerPath, { encoding: "utf8" });
  console.error(`TTTTT header.css : ${ headerCSS }`);
  t.is(headerCSS, "header{background-color:red}");
});
