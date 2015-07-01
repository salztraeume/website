var gulp = require('gulp');
var livereload = require('gulp-livereload');

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('./src/documents/**/*.{jade,md}', ['templates']);
  gulp.watch('./src/layouts/**/*.jade', ['templates']);

  gulp.watch('./src/documents/**/*.less', ['styles']);
  gulp.watch('./src/files/**/*', ['javascript']);
  gulp.watch('./src/raw/**/*.{jpg,jpeg,png,gif,svg}', ['copy']);
});