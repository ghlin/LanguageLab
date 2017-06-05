const gulp        = require('gulp');
const ts          = require('gulp-typescript');
const clean       = require('gulp-clean');
const runSequence = require('run-sequence');
const nodemon     = require('gulp-nodemon');
const sourcemaps  = require('gulp-sourcemaps');
const log         = require('gulp-logger');
const gutil       = require('gulp-util');
const colors      = require('colors');
const map         = require('map-stream');

const dist = 'dist';

const trace = (head) => map((file, next) => {
  gutil.log(head, `*** ${file.path.green}`);
  next(null, file);
});

gulp.task('clean', () => {
  return gulp.src(`${dist}/*`, { read: false }).pipe(clean());
});

const tsProj = ts.createProject('tsconfig.json');

gulp.task('compile', () => {
  const result = gulp.src('src/**/*.ts')
    .pipe(sourcemaps.init()).pipe(tsProj());

  return result.js
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(dist));
});

gulp.task('static-files', () => {
  return gulp.src([ 'src/bin/**', 'src/config/*' ], { base: './src' })
    .pipe(gulp.dest(dist));
});

const nodemonEnv = { NODE_ENV: 'development'
                   , DEBUG:    'LL:*' };

gulp.task('start', () =>
  nodemon({ script: `${dist}/main`
          , ext: 'js json'
          , env: nodemonEnv }));

gulp.task('node-test', () =>
  nodemon({ script: `${dist}/test`
          , ext: 'js json'
          , env: nodemonEnv }));

gulp.task('watch', ['compile'], () => {
  gulp.watch('src/**/*.ts', ['compile']);
});

gulp.task('build', (callback) => {
  runSequence('clean', 'compile', 'static-files', callback);
});

gulp.task('default', () => {
  runSequence('compile', 'static-files', 'watch', 'start');
});

gulp.task('test', () => {
  runSequence('compile', 'static-files', 'watch', 'node-test');
});

