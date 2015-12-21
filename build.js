var fs = require("fs");
var browserify = require("browserify");
browserify("./conversant-api.js")
  .transform("babelify", {presets: ["es2015"]})
  .bundle()
  .pipe(fs.createWriteStream("bundle.js"));
