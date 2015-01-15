var DE_FORMATTER = 'DD.MM.YYYY';

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

// moment isBefore IE workarround

var toDates = function(moment1, moment2) {
    return [moment1.toDate().getTime(), moment2.toDate().getTime()];
}

var isBefore = function(moment1, moment2) {
    var tmp = toDates(moment1, moment2);
    return tmp[0] < tmp[1];
};

var isAfter = function(moment1, moment2) {
    var tmp = toDates(moment1, moment2);
    return tmp[0] > tmp[1];
};


//  +++ calendar +++

var fetchCal = function(cb) {
    // wait if the file was not loaded yet
    if (window.calendar_items == null) {
        setTimeout(function() {
            fetchCal(cb);
        }, 100);
    } else {
        cb(window.calendar_items);
    }
};


var clearCal = function() {
    var emptyTable = window.tableTemplate.clone();
    $('table.booking-calendar').replaceWith(emptyTable);
};

var calcCalendar = function(dayInMonth) {
    var formatted = dayInMonth.format("MMMM YYYY");
    $('input.date').val(formatted);

    var start = moment(dayInMonth).startOf('month');
    var end = moment(dayInMonth).endOf('month');

    var weekDay = null;
    var selector = null;
    var week = 1;
    var cellTemplate = "<div class='calDate'></div>";
    var flat = $(".booking-calendar").attr('data-flat'); // specific flat
    if (flat != null || flat == '') {
        cellTemplate += "<div class='flat "+flat+"'><span class='title'></span></div>";
    } else {
        cellTemplate +=
        "<div class='flat SL'><span class='title'></span></div>"+
        "<div class='flat EH'><span class='title'></span></div>"+
        "<div class='flat F1'><span class='title'></span></div>"+
        "<div class='flat F2'><span class='title'></span></div>"+
        "<div class='flat F3'><span class='title'></span></div>";
    }
    
    while (isBefore(start, end)) {
        var dateOfMonth = start.date();
        weekDay = start.format('e');
        selector = '.d'+weekDay+'.w'+week;
        //$(selector).text(dateOfMonth);
        $(selector).addClass('date'+dateOfMonth);
        $(selector).attr('data-date', dateOfMonth);
        $(selector).append(cellTemplate);
        $(selector).find('.calDate').text(dateOfMonth);

        if (start.format(DE_FORMATTER) === moment().format(DE_FORMATTER)) {
            $(selector).addClass('today');
        }

        // increment for next iteration
        start.add(1, 'days');
        if(weekDay == 6) {
            week++;
        }
        
    }
    // remove weeks with no days
    if ($("tr.w5 td div").length === 0) $("tr.w5").remove();
    if ($("tr.w6 td div").length === 0) $("tr.w6").remove();
};

var updateItems = function(data) {
    data.items.forEach(function(item) {
        var start = moment(item.start.date);
        var end = moment(item.end.date);

        // chdck for dateTime
        if (item.end.dateTime != null) {
            start = moment(item.start.dateTime);
            start = moment(start.format(DE_FORMATTER), DE_FORMATTER);
            // fill up 'end' to the next day midnight
            end = moment(item.end.dateTime).add(1, 'days');
            end = moment(end.format(DE_FORMATTER), DE_FORMATTER);
        }
        var tmp = moment(start);
        if (item.location == null) {
            // try to resolve by summary
            switch ($.trim(item.summary)) {
                case 'Schmetterling': 
                    item.location = 'SL';
                    break;
                case 'Eichhörnchen': 
                    item.location = 'EH';
                    break;
                case 'Fuchs': 
                    item.location = 'FS';
                    break;
                case 'Fuchs1', 'FS1':
                    item.location = "F1";
                    break;
                case 'Fuchs2', 'FS2':
                    item.location = "F2";
                    break;
                case 'Fuchs3', 'FS3':
                    item.location = "F3";
                    break;
            }
        }

        var stopCondition = moment(end);
        while (isBefore(tmp, stopCondition)) {
            // check if tmp is within the current month
            if (tmp.format('MM.YYYY') == current.format('MM.YYYY')) {
                var date = tmp.date();
                var cssClass = '';
                if (tmp.format(DE_FORMATTER) === start.format(DE_FORMATTER)) {
                    cssClass = 'start';
                } else if (tmp.format(DE_FORMATTER) === moment(end).add(-1, 'days').format(DE_FORMATTER)) {
                    cssClass = 'end';
                } else {
                    cssClass = 'middle';
                }
                if (item.location === 'FS') {
                    setFlat($('.date'+date+' .F1'), item, cssClass);
                    setFlat($('.date'+date+' .F2'), item, cssClass);
                    setFlat($('.date'+date+' .F3'), item, cssClass);
                } else {
                    setFlat($('.date'+date+' .'+item.location), item, cssClass);
                }
                
            }
            tmp.add(1, 'days');
            m1 = tmp.toDate().getTime();
        }
    });

};

var sortItems = function(data) {
    data.items.sort(function (a, b) {
        aStart = a.start.date || a.start.dateTime;
        bStart = b.start.date || b.start.dateTime;

        if (isAfter(moment(aStart), moment(bStart))) {
            return 1;
        }
        if (isBefore(moment(aStart), moment(bStart))) {
            return -1;
        }
        // a must be equal to b
        return 0;
    });
};

var updateItemsForCurrentMonth = function() {
    if (window.caldata) {
        updateItems(window.caldata);
    } else {
        fetchCal(function(data) {
            window.caldata = sortItems(data);
            updateItems(data);
        });
    }
    considerFlatFilter();
    // enable tooltips
    $('[data-toggle="tooltip"]').tooltip();
};

var considerFlatFilter = function() {
    var flatShortcuts = ['SL', 'EH', 'F1', 'F2', 'F3'];
    for (var i=0; i<flatShortcuts.length; i++) {
        var flatShortcut = flatShortcuts[i];
        var filterElement = $('.filter-' + flatShortcut);
        if (filterElement.length === 0) continue;
        if (filterElement[0].checked === false) {
            $('.' + flatShortcut).hide();
        }
    }
};

var setFlat = function(flat, item, cssClass) {
    flat.addClass(cssClass);
    //data-toggle="tooltip", data-placement="top", title="
    flat.attr('data-toggle', 'tooltip');
    flat.attr('data-placement', 'top');
    flat.attr('title', item.summary);
    //flat.find('.title').text(item.summary);
    flat.append('<div data-id="'+item.id+'"></div>');
};

$(document).ready(function() {

    //  +++ calendar +++
    if ($('table.booking-calendar').length === 0) {
        return;
    }

    window.tableTemplate = $('table.booking-calendar').clone();
    window.current = moment();
    
    calcCalendar(current);
    updateItemsForCurrentMonth();

    $('.prev').click(function(e) {
        current.subtract(1, 'months');
        clearCal();
        calcCalendar(current);
        updateItemsForCurrentMonth();
        e.preventDefault();
    });
    $('.next').click(function(e) {
        current.add(1, 'months');
        clearCal();
        calcCalendar(current);
        updateItemsForCurrentMonth();
        e.preventDefault();
    });
    $('.filter-SL').change(function() {
        $('.SL').toggle();
    });
    $('.filter-EH').change(function() {
        $('.EH').toggle();
    });
    $('.filter-F1').change(function() {
        $('.F1').toggle();
    });
    $('.filter-F2').change(function() {
        $('.F2').toggle();
    });
    $('.filter-F3').change(function() {
        $('.F3').toggle();
    });

});