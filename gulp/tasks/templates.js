var _ = require('lodash'); // to handle collections gracefully
var config = require('../config'); // pull in the pathing config file
var fs = require('fs'); // used to work with substack's module
var path = require('path'); // use for get dirname of a path
var glob = require('glob'); // to dynamically read in all content md files
var gulp = require('gulp'); // because this is a gulp task. duh.
var jadeGulp = require('gulp-jade'); // to render jade to html.
var jade = require('jade');
var rename = require('gulp-rename'); // to use different file name between input and output
var utils = require('../util/template-utils.js');
var debug = require('debug')('salz.task.templates');
var livereload = require('gulp-livereload');

gulp.task('templates', function() {
  var contentFiles = glob.sync(config.templates.contentSrc); // read in all src/documents
  
  var jadeFiles = utils.loadJadeFiles(contentFiles);
  _.forEach(jadeFiles, function(file) {
    debug(file.srcPath);
    var jadeFileContent = String(fs.readFileSync(file.srcPath));
    var meta = utils.parseDocumentMeta(jadeFileContent);
    jadeFileContent = utils.removeDocumentMeta(jadeFileContent);
    var renderedMainContent = jade.render(jadeFileContent, {filename: file.srcPath});
    meta.mainContent = renderedMainContent;

    var filepath = __dirname.split('gulp/tasks')[0] + 'src/layouts/master.html.jade';
    var outPath = file.filepathArray.slice(2).join('/'); // cut off the src/documents path
    var destinationDirectory = path.dirname(config.dest + '/' + outPath);

    gulp.src(filepath) // read jade template
    .pipe(jadeGulp({ // render template while passing locals
      locals: _.cloneDeep(meta)
    }))
    .pipe(rename(file.filename + '.html')) // rename output file, using md filename 
    .pipe(gulp.dest(destinationDirectory)) // dump it in the appropriate language subfolder
    .pipe(livereload());
  });
});