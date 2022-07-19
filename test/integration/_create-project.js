// const fs = require("fs");
// const path = require("path");
// const sourceDir = path.join(__dirname, "fixtures", "eleventy-project");
//
// module.exports = function(projectName) {
//   let projectDir = path.join(__dirname, "fixtures", projectName);
//   fs.rmSync(projectDir, { recursive: true, force: true });
//   fs.mkdirSync(projectDir);
//   fs.mkdirSync(path.join(projectDir, "dist"));
//
//   let names = fs.readdirSync(sourceDir);
//   names.forEach(name => {
//     fs.symlinkSync(path.join(sourceDir, name), path.join(projectDir, name));
//   });
//   ["package.json", "package-lock.json", "node_modules"].forEach(name => {
//     fs.symlinkSync(name, path.join(projectDir, name));
//   });
//
//   return projectDir;
// };
const { promises: fs } = require("fs");
const path = require("path");
const sourceDir = path.join(__dirname, "fixtures", "eleventy-project");

const createProject = async function(projectName) {
  let projectDir = path.join(__dirname, "fixtures", projectName);
  await fs.rm(projectDir, { recursive: true, force: true });
  await fs.mkdir(projectDir);
  let names = await fs.readdir(sourceDir);
  let promises = names.map(async name => {
    await fs.symlink(path.join(sourceDir, name), path.join(projectDir, name));
  });
  await Promise.all(promises);
  // await fs.cp(sourceDir, projectDir, { recursive: true });

  let root = path.resolve(".");
  promises = ["package.json", "package-lock.json", "node_modules"].map(async name => {
    await fs.symlink(path.join(root, name), path.join(projectDir, name));
  });
  await Promise.all(promises);
  // console.error(abs);

  return projectDir;
};

module.exports = createProject;
