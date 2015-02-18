var dest = './build';
var src = './src/files';
var content = './src/documents';

var urlPrefix = '';
if (process.env.URL_PREFIX && process.env.URL_PREFIX !== '') {
  urlPrefix = '/' + process.env.URL_PREFIX;
}

module.exports = {
  templates: {
    urlPrefix: urlPrefix, // need this, if the website it not located at the root of a domain
    contentSrc: content + '/**/*.html.jade',
  },
  dest: dest,
  server: {
    port: 9777
  }
};
