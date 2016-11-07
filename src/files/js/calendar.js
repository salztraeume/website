var DE_FORMATTER = 'DD.MM.YYYY';

//  +++ calendar +++

var fetchCal = function(cb) {
    // wait if the file was not loaded yet
    if (window.calendar_items == null) {
        setTimeout(function() {
            fetchCal(cb);
        }, 100);
    } else {
        injectBlockingMap(window.calendar_items.items);
        cb(window.calendar_items);
        $('.ajax-spinner').hide();
    }
};

var injectBlockingMap = function(items) {
    var itemKeys = Object.keys(items);
    var map = {};
    var DAY_PRECISION = 'YYYY-MM-DD';
    for (var i = 0; i < itemKeys.length; i++) {
      var item = items[i];
      var start = moment(item.start.dateTime);
      var end = moment(item.end.dateTime);
      while (start.format(DAY_PRECISION) !== end.format(DAY_PRECISION)) {
        map[start.format(DAY_PRECISION) + '_' + item.location] = true;
        start.add(1, 'day');
      }
    }
    window.blockingMap = map;
};

var clearCal = function() {
    var emptyTable = window.tableTemplate.clone();
    $('table.booking-calendar').each(function() {
        $(this).replaceWith(emptyTable);
    });
};

var calcCalendar = function(dayInMonth) {
    var calendars = $(".booking-calendar");
    if (calendars.length > 1) {
        for (var i=0; i<calendars.length; i++) {
            var calendar = calendars[i];
            var monthValue = $(calendar).attr('data-month');
            calcSingleCalendar(moment(dayInMonth).add(monthValue, 'month'), calendar);
        }
    } else {
        calcSingleCalendar(dayInMonth, $(".booking-calendar")[0]);
    }
};

var calcSingleCalendar = function(dayInMonth, scope) {

    var formatted = dayInMonth.format("MMMM YYYY");
    if ($('th.month-name', scope).length > 0) {
        $('th.month-name', scope).text(formatted);
    }
    if ($('input.date').length > 0) {
        $('input.date').val(formatted);
    }

    var start = moment(dayInMonth).startOf('month');
    var end = moment(dayInMonth).endOf('month');

    var weekDay = null;
    var selector = null;
    var week = 1;
    var cellTemplate = "<div class='calDate'></div>";
    var flat = $(scope).attr('data-flat'); // specific flat
    if (flat != null || flat == '') {
        if (flat === 'FS') {
            cellTemplate +=
            "<div class='flat F1'><span class='title'></span></div>"+
            "<div class='flat F2'><span class='title'></span></div>"+
            "<div class='flat F3'><span class='title'></span></div>";
        } else {
            cellTemplate += "<div class='flat "+flat+"'><span class='title'></span></div>";
        }
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
        if ($(selector, scope).find(".calDate").length > 0) {
            $(selector, scope).empty();
        }
        $(selector, scope).addClass('date'+dateOfMonth);
        $(selector, scope).attr('data-date', dateOfMonth);
        $(selector, scope).append(cellTemplate);
        $(selector, scope).find('.calDate').text(dateOfMonth);

        if (start.format(DE_FORMATTER) === moment().format(DE_FORMATTER)) {
            $(selector, scope).addClass('today');
        }

        // increment for next iteration
        start.add(1, 'day');
        if(weekDay == 6) {
            week++;
        }

    }
    // remove weeks with no days
    if ($("tr.w5 td div", scope).length === 0) $("tr.w5", scope).remove();
    if ($("tr.w6 td div", scope).length === 0) $("tr.w6", scope).remove();
};

var updateItems = function(data, monthToShow) {
    var dayInMonth = window.current;
    var calendars = $(".booking-calendar");
    if (calendars.length > 1) {
        for (var i=0; i<calendars.length; i++) {
            var calendar = calendars[i];
            var monthValue = $(calendar).attr('data-month');
            updateItemsForSingleCalendar(data, moment(dayInMonth).add(monthValue, 'month'), calendar);
        }
    } else {
        calcSingleCalendar(dayInMonth, $(".booking-calendar")[0]);
        updateItemsForSingleCalendar(data, dayInMonth, $(".booking-calendar")[0]);

    }
};

var updateItemsForSingleCalendar = function(data, monthToShow, scope) {
    data.items.forEach(function(item) {
        var start = moment(item.start.date);
        var end = moment(item.end.date);

        // check for dateTime
        if (item.end.dateTime != null) {
            start = moment(item.start.dateTime);
            start = moment(start.format(DE_FORMATTER), DE_FORMATTER);
            // fill up 'end' to the next day midnight
            end = moment(item.end.dateTime).add(1, 'day');
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
                default:
                    console.log('could not match flat name for: '+item.summary);
            }
        }
        // set summary by location for cases with a r_id is only set
        if (isNaN(parseInt(item.summary))) {
            // do nothing
        } else {
            // r_id is set
            // add also the flat full name
            var flatName = '';
            switch(item.location) {
                case 'SL': flatName  = 'Schmetterling'; break;
                case 'EH': flatName  = 'Eichhörnchen'; break;
                case 'F1': flatName  = 'Fuchs'; break;
                case 'F2': flatName  = 'Fuchs'; break;
                case 'F3': flatName  = 'Fuchs'; break;
                default: console.log('could not identify location for: ' + JSON.stringify(item));
            }
            item.summary = flatName;
        }

        var stopCondition = moment(end);
        while (isBefore(tmp, stopCondition)) {
            // check if tmp is within the current month
            if (tmp.format('MM.YYYY') == monthToShow.format('MM.YYYY')) {
                var date = tmp.date();
                var cssClass = '';
                if (tmp.format(DE_FORMATTER) === start.format(DE_FORMATTER)) {
                    cssClass = 'start';
                } else if (tmp.format(DE_FORMATTER) === moment(end).add(-1, 'day').format(DE_FORMATTER)) {
                    cssClass = 'end';
                } else {
                    cssClass = 'middle';
                }
                if (item.location === 'FS') {
                    setFlat($('.date'+date+' .F1', scope), item, cssClass);
                    setFlat($('.date'+date+' .F2', scope), item, cssClass);
                    setFlat($('.date'+date+' .F3', scope), item, cssClass);
                } else {
                    setFlat($('.date'+date+' .'+item.location, scope), item, cssClass);
                }

            }
            tmp.add(1, 'day');
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
            $('.booking-calendar .' + flatShortcut).hide();
        }
    }
};

var setFlat = function(flat, item, cssClass) {
    flat.addClass(cssClass);
    //data-toggle="tooltip", data-placement="top", title="
    flat.attr('data-toggle', 'tooltip');
    flat.attr('data-placement', 'top');
    var title = item.summary;
    flat.attr('title', title);
    //flat.find('.title').text(item.summary);
    flat.append('<div data-id="'+item.id+'"></div>');
};

$(document).ready(function() {

    //  +++ calendar +++
    if ($('table.booking-calendar').length === 0) {
        return;
    }

    window.tableTemplate = $('table.booking-calendar').clone();
    // initial is now
    //TODO: maybe should better be the start date's month
    window.current = moment();

    calcCalendar(window.current);
    updateItemsForCurrentMonth();

    $('.prev').click(function(e) {
        window.current.subtract(1, 'months');
        clearCal();
        calcCalendar(window.current);
        updateItemsForCurrentMonth();
        e.preventDefault();
    });
    $('.next').click(function(e) {
        window.current.add(1, 'month');
        clearCal();
        calcCalendar(window.current);
        updateItemsForCurrentMonth();
        e.preventDefault();
    });
    $('.filter-SL').change(function() {
        $('.booking-calendar .SL').toggle();
        if (setPermaLink) setPermaLink('filter', 'SL');
    });
    $('.filter-EH').change(function() {
        $('.booking-calendar .EH').toggle();
        if (setPermaLink) setPermaLink('filter', 'EH');
    });
    $('.filter-F1').change(function() {
        $('.booking-calendar .F1').toggle();
        if (setPermaLink) setPermaLink('filter', 'F1');
    });
    $('.filter-F2').change(function() {
        $('.booking-calendar .F2').toggle();
        if (setPermaLink) setPermaLink('filter', 'F2');
    });
    $('.filter-F3').change(function() {
        $('.booking-calendar .F3').toggle();
        if (setPermaLink) setPermaLink('filter', 'F3');
    });

});