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

    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== "function") {
      throw new TypeError(callback + ' is not a function');
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (arguments.length > 1) {
      T = thisArg;
    }

    // 6. Let k be 0
    k = 0;

    // 7. Repeat, while k < len
    while (k < len) {

      var kValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[k];

        // ii. Call the Call internal method of callback with T as the this value and
        // argument list containing kValue, k, and O.
        callback.call(T, kValue, k, O);
      }
      // d. Increase k by 1.
      k++;
    }
    // 8. return undefined
  };
}

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
    var cellTemplate = "<div class='calDate'></div>"+
    "<div class='flat SL'><span class='title'></span></div>"+
    "<div class='flat EH'><span class='title'></span></div>"+
    "<div class='flat F1'><span class='title'></span></div>"+
    "<div class='flat F2'><span class='title'></span></div>"+
    "<div class='flat F3'><span class='title'></span></div>";
    while (start.isBefore(end)) {
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
            switch (item.summary) {
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
        var m1 = tmp.toDate().getTime();
        var m2 = stopCondition.toDate().getTime();
        while(m1 < m2) {
            // check if tmp is within the current month
            if (tmp.format('MM.YYYY') == current.format('MM.YYYY')) {
                var date = tmp.date();
                var cssClass = '';
                if (tmp.format(DE_FORMATTER) === start.format(DE_FORMATTER)) {
                    cssClass = 'start'
                } else if (tmp.format(DE_FORMATTER) === moment(end).add(-1, 'days').format(DE_FORMATTER)) {
                    cssClass = 'end'
                } else {
                    cssClass = 'middle'
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

        if (moment(aStart).isAfter(moment(bStart))) {
            return 1;
        }
        if (moment(aStart).isBefore(moment(bStart))) {
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
};

var considerFlatFilter = function() {
    var flatShortcuts = ['SL', 'EH', 'F1', 'F2', 'F3'];
    for (var i=0; i<flatShortcuts.length; i++) {
        var flatShortcut = flatShortcuts[i];
        var filterElement = $('.filter-' + flatShortcut);
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