var gulp = require( 'gulp' );
var gutil = require( 'gulp-util' );
var ftp = require( 'vinyl-ftp' );

gulp.task( 'deploy', function () {

    var conn = ftp.create( {
        host:     process.env.FTP_HOST,
        user:     process.env.FTP_USER,
        password: process.env.FTP_PASS,
        parallel: 10,
        log:      gutil.log
    } );

    var globs = [
        'build/**'
    ];

    // using base = '.' will transfer everything to /public_html correctly
    // turn off buffering in gulp.src for best performance

    return gulp.src( globs, { base: 'build', buffer: false } )
        .pipe( conn.newer( '/.' ) ) // only upload newer files
        .pipe( conn.dest( '/.' ) );

} );
