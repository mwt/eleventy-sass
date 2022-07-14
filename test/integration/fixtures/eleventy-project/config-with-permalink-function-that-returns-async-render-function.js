const sass = require("../../../..");
const pluginRev = require("eleventy-plugin-rev");
const path = require("path");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRev);
  eleventyConfig.addPlugin(sass, {
    compileOptions: {
      permalink: function(permalinkString, inputPath) {
        return async (data) => {
          return data.page.filePathStem.replace(/\/stylesheets\//, "/css/") + ".css";
        };
      }
    },
    rev: true
  });
};
