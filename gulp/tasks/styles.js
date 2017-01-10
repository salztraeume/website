var config = require('../config'); // pull in the pathing config file
var gulp = require('gulp'); // because this is a gulp task. duh.
var rename = require('gulp-rename'); // to use different file name between input and output
var less = require('gulp-less');

gulp.task('styles', function() {

    gulp.src('./src/documents/styles/all.less')
    .pipe(less({
      paths: [ './src/documents/styles']
    }))
    .pipe(gulp.dest(config.dest+'/styles'));
});