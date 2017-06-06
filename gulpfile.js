const gulp        = require('gulp');
const ts          = require('gulp-typescript');
const clean       = require('gulp-clean');
const runSequence = require('run-sequence');
const nodemon     = require('gulp-nodemon');
const sourcemaps  = require('gulp-sourcemaps');
const log         = require('gulp-logger');
const gutil       = require('gulp-util');
const mocha       = require('gulp-mocha');
const colors      = require('colors');
const map         = require('map-stream');

const dist = 'dist';

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

gulp.task('run-repl', () =>
  nodemon({ script: `${dist}/main`
          , ext: 'js json'
          , env: nodemonEnv }));

gulp.task('mocha', () => {
  return gulp.src([`test/**/*.js`], { read: false })
    .pipe(mocha({ reporter: 'nyan' }))
    .on('error', gutil.log);
});

gulp.task('watch', [ 'compile' ], () => {
  gulp.watch('src/**/*.ts', ['compile']);
  gulp.watch([ 'test/**/*.js', `${dist}/**/*.js` ], ['mocha']);
});

gulp.task('build', (callback) => {
  runSequence('clean', 'compile', 'static-files', callback);
});

gulp.task('default', () => {
  runSequence('compile', 'static-files', 'watch', 'mocha');
});

gulp.task('repl', () => {
  runSequence('compile', 'static-files', 'watch', 'run-repl');
});

