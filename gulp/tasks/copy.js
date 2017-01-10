var gulp = require('gulp');
var config = require('../config');

gulp.task('copy', function() {
    gulp.src('./src/raw/img/**/*')
    .pipe(gulp.dest(config.dest+'/img'));

    gulp.src([
        './src/files/**/*',
        '!./src/files/js/**/*']
    ).pipe(gulp.dest(config.dest));
});