$('[data-toggle="tooltip"]').tooltip();

// moment isBefore, isAfter IE workarround

var toDates = function(moment1, moment2) {
    return [moment1.toDate().getTime(), moment2.toDate().getTime()];
};

var isBefore = function(moment1, moment2) {
    var tmp = toDates(moment1, moment2);
    return tmp[0] < tmp[1];
};

var isAfter = function(moment1, moment2) {
    var tmp = toDates(moment1, moment2);
    return tmp[0] > tmp[1];
};

setInterval(function() {
  var faviconElement = $('link.favicon');
  var prefix = faviconElement.attr('data-prefix');
  var suffix = faviconElement.attr('data-suffix');
  var oldHref = faviconElement[0].href.substr(location.origin.length);
  var match = oldHref.match(/\d/);
  if (match) {
    var number = parseInt(match[0]) + 1;
    if (number > 5) {
      number = 1;
    }
    $('link.favicon')[0].href = prefix + number + suffix;
  }
}, 100);


// polyfills

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(callback, thisArg) {
    var T, k;
    if (this == null) {
      throw new TypeError(' this is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== "function") {
      throw new TypeError(callback + ' is not a function');
    }
    if (arguments.length > 1) {
      T = thisArg;
    }
    k = 0;
    while (k < len) {
      var kValue;
      if (k in O) {
        kValue = O[k];
        callback.call(T, kValue, k, O);
      }
      k++;
    }
  };
}