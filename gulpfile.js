"use strict"

const
  gulp         = require("gulp"),
  plumber      = require("gulp-plumber"),
  rename       = require("gulp-rename"),
  autoprefixer = require("gulp-autoprefixer"),
  coffee       = require("gulp-coffee"),
  uglify       = require("gulp-uglify"),
  imagemin     = require("gulp-imagemin"),
  cache        = require("gulp-cache"),
  minifycss    = require("gulp-minify-css"),
  stylus       = require("gulp-stylus");

// Image Compression
gulp.task("images", () => {
  gulp.src("src/images/**/*")
    .pipe(cache(imagemin({
      optimizationLevel : 3,
      progressive       : true,
      interlaced        : true
    })))
    .pipe(gulp.dest("dist/images/"));
});

// Stylus compilation and minification
gulp.task("styles", () => {
  gulp.src(["src/styles/**/*.styl"])
    .pipe(plumber({
      errorHandler: (error) => {
        console.log(error.message);
        this.emit("end");
    }}))
    .pipe(stylus())
    .pipe(autoprefixer("last 2 versions"))
    .pipe(gulp.dest("dist/styles/"))
    .pipe(rename({suffix: ".min"}))
    .pipe(minifycss())
    .pipe(gulp.dest("dist/styles/"));
});

// CoffeeScript transpiling and minification
gulp.task("scripts", () => {
  return gulp.src("src/scripts/**/*.coffee")
    .pipe(plumber({
      errorHandler: (error) => {
        console.log(error.message);
        this.emit("end");
    }}))
    .pipe(coffee({bare: true}))
    .pipe(gulp.dest("dist/scripts/"))
    .pipe(rename({suffix: ".min"}))
    .pipe(uglify())
    .pipe(gulp.dest("dist/scripts/"));
});

// Default watch tasks
gulp.task("default", () => {
  gulp.watch("src/styles/**/*.styl", ["styles"]);
  gulp.watch("src/scripts/**/*.coffee", ["scripts"]);
  gulp.watch("src/images/**/*", ["images"]);
});
