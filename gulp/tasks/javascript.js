var gulp = require('gulp');
var concat = require('gulp-concat');
var config = require('../config');
gulp.task('javascript', function() {

    var jsFiles = [
        './src/files/js/jquery-1.11.3.js',
        './src/files/js/bootstrap.min.js',
        './src/files/js/ie10.js',
        './src/files/js/bootstrap-datepicker.js',
        './src/files/js/locales/bootstrap-datepicker.de.js',
        './src/files/js/moment.js',
        './src/files/js/moment-de.js',
        './src/files/js/calendar.js',
        './src/files/js/buchen.js',
        './src/fileS/js/init.js'
    ];

    if (process.env.OFFLINE) {
        jsFiles.push('./src/files/js/offline_calendar.js');
    }

    gulp.src(jsFiles)
    .pipe(concat('scripts.js'))
    .pipe(gulp.dest(config.dest+'/js'));

});