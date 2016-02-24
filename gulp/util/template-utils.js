var _ = require('lodash');
var exec = require('child_process').exec;
var moment = require('moment-timezone');
var config = require('../config').templates; // pull in the pathing config file

var DEFAULT_LANG = 'de';
var CONTENT_DIRECTORY = 'src/documents';

// load template.json for given language
module.exports.loadTemplateJSON = function(lang) {
  var defaultJSON = require('../../' + CONTENT_DIRECTORY + '/' + DEFAULT_LANG + '/template.json'); 
  var templateJSON = require('../../' + CONTENT_DIRECTORY + '/' + lang + '/template.json');
  var finalJSON = _.cloneDeep(defaultJSON);
  finalJSON.__translated = {}; // meta information if a key was translated in the given lang
  _.forEach(templateJSON, function(value, key) {
    finalJSON[key] = value;
    finalJSON.__translated[key] = true;
  });
  finalJSON.urlPrefix = config.urlPrefix;
  finalJSON.lang = lang; // extend to provide html lang attribute into the template

  return finalJSON;
};

var META_PATTERN = /---[\s\S]*--/gm;

module.exports.parseDocumentMeta = function(string) {
  var meta = {};
  var result = string.match(META_PATTERN);
  if (result == null) return meta;
  result[0].split('\n').forEach(function(item) {
    var pairs = item.split(':');
    if (pairs.length !== 2) return;
    meta[pairs[0].trim()] = pairs[1].trim(); // meta[key] = value
  });
  return meta;
};

module.exports.removeDocumentMeta = function(str) {
  return str.replace(META_PATTERN, '');
};

// load all the files for a given language
// return an object with
// - the origin srcPath
// - the filename without extension
// - the filepath as an array, reduced by the starting './content' directory
module.exports.loadJadeFiles = function(contentFiles, lang, prefix) {
  if (prefix == null) {
    prefix = '';
  }
  var templateFiles = contentFiles.filter(function(str) {
    return str.indexOf('./' + CONTENT_DIRECTORY + '/' + prefix) > -1;
  });

  var templateFilesInThisLang = _.map(templateFiles, function(str) { // expand the file list to include the extrapolated filename
    var obj = {};
    obj.srcPath = str;
    obj.filepathArray = str.split('/');
    obj.filepathArray = _.filter(obj.filepathArray, function(pathPart) {
      if (pathPart !== '.' && pathPart !== CONTENT_DIRECTORY) {
        return true;
      }
    });
    obj.filename = obj.filepathArray[obj.filepathArray.length-1];
    obj.filename = obj.filename.split('.html.jade')[0];
    return obj;
  });
  return templateFilesInThisLang;
};

module.exports.addBuildMeta = function(templateJSON, cb) {
  var separator = '<SEPARATOR>';
  var cmd = 'git log --no-color --pretty=format:\'[ "%H", "%s", "%cr", "%an" ],\' --abbrev-commit';
  cmd = cmd.replace(/"/g, separator);
  _command(cmd, function(str) {
    str = str.substr(0, str.length - 1);
    str = str.replace(/"/g, '\\"');
    str = str.replace(/\\\./g, '\\\\.');
    str = str.replace(new RegExp(separator, 'g'), '"');
    var commits = JSON.parse('[' + str + ']');
    var lastCommit = commits[0];
    templateJSON.buildTime = moment().tz('UTC').format('YYYY-MM-DD HH:mm:ss') + ' UTC';
    templateJSON.commitSha = lastCommit[0];
    templateJSON.commitMsg = lastCommit[1];
    cb();
 });
};

function _command(cmd, cb) {
  exec(cmd, function(err, stdout, stderr) {
    if (err) {
      console.log(err);
      console.log(stderr);
      process.exit(1);
    }
    cb(stdout.split('\n').join(''));
  });
}