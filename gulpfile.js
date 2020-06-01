var gulp = require('gulp');
var zip = require('gulp-zip');

gulp.task('dist', (done) => {
  gulp.src(['src/**'])
    .pipe(zip('extension.zip'))
    .pipe(gulp.dest('./dist'));

  done();
});