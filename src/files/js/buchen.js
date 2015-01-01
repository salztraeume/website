var apiKey = 'AIzaSyDGe2JRJfoty5LN_U6ObHMP02MjvKS5aP8'; 
var calendarId = 'jalu3vd0rqj67ojfs5ld8ecrdc@group.calendar.google.com';
var fields = 'description,items(id,created,end,start,status,summary,updated,location),summary';
var base = 'https://www.googleapis.com/calendar/v3/calendars/';
var url = base + calendarId + '/events?fields=' + fields + '&key=' + apiKey;

var DE_FORMATTER = 'DD.MM.YYYY';
var DATEPICKER_SELECTOR = '.conainter.booking .input-daterange';
var DATEPICKER_OPTS = {
    format: "dd.mm.yyyy",
    weekStart: 1,
    language: "de",
    calendarWeeks: true,
    autoclose: true,
    todayHighlight: true,
    todayBtn: true
};

var fetchCal = function(cb) {
    $.ajax({
        type: 'GET',
        url: encodeURI(url),
        dataType: 'json',
        success: function (response) {
            cb(response);
        },
        error: function (response) {
            console.error("ERROR");
            cb(response.responseText); 
        }
    });
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
    "<div class='flat FS'><span class='title'></span></div>";
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
            }
        }

        var stopCondition = moment(end);//.add(1, 'days');

        while(tmp.isBefore(stopCondition)) {
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
                var flat = $('.date'+date+' .'+item.location);
                flat.addClass(cssClass);
                //data-toggle="tooltip", data-placement="top", title="
                flat.attr('data-toggle', 'tooltip');
                flat.attr('data-placement', 'top');
                flat.attr('title', item.summary);
                //flat.find('.title').text(item.summary);
                flat.append('<div data-id="'+item.id+'"></div>');
            }
            tmp.add(1, 'days');
        }
    });
    // init the flat tooltips
    $('[data-toggle="tooltip"]').tooltip();
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
}; 


$(document).ready(function() {

    if ($('table.booking-calendar').length === 0) {
        return;
    }

    window.tableTemplate = $('table.booking-calendar').clone();
    window.current = moment();
    DATEPICKER_OPTS.startDate = window.current.format(DE_FORMATTER);
    $(DATEPICKER_SELECTOR).datepicker(DATEPICKER_OPTS);
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
    $('.filter-FS').change(function() {
        $('.FS').toggle();
    });

    // blur immediately to avoid ios android keyboard overlay
    $('#b_arrival, #b_departure').on('click', function(e) {
        e.target.blur();
    });

    $('#guests_control input').on('change', function(e) {
        var inputs = $('#guests_control input');
        var a = parseInt(inputs[0].value || 0);
        var b = parseInt(inputs[1].value || 0);
        var c = parseInt(inputs[2].value || 0);
        $('#b_guests_total').val(a+b+c);
    });

    $('#b_submit').on('click', function(e) {
        e.preventDefault();

        var form = $('.conainter.booking')[0];
        if (form.checkValidity && !form.checkValidity()) {
            var inputs = form.querySelectorAll("input");
            for (var i=0; i<inputs.length; i++) {
                if (!inputs[i].validity.valid) {
                    var msg = inputs[i].validationMessage;
                    var popoverContainer = $(inputs[i]);
                    popoverContainer.attr('data-placement', 'top');
                    popoverContainer.attr('data-content', msg);
                    popoverContainer.attr('data-trigger', 'manual focus');
                    popoverContainer.popover('show');
                    popoverContainer.on('hidden.bs.popover', function (e) {
                      $(e.target).popover('destroy');
                    });
                }
            }
        } else {

            var flat = $('#b_flat').val() || '-';
            var from = $('#b_arrival').val() || '-';
            var to = $('#b_departure').val() || '-';
            var fromDate = moment(from, DE_FORMATTER);
            var toDate = moment(to, DE_FORMATTER);
            var nights = moment(toDate).diff(fromDate, 'days');

            var guests = $('#b_guests_total').val() || '-';
            var guests_adult = $('#b_guests_children').val() || '-';
            var guests_children = $('#b_guests_children').val() || '-';
            var guests_children_free = $('#b_guests_children_free').val() || '-';
            var name = $('#b_name').val() || '-';
            var email = $('#b_email').val() || '-';
            var phone = $('#b_phone').val() || '-';
            var note = $('#b_note').val() || '-';

            var NL = "%0D%0A";
            var subject = "Buchung: "+from+" - "+to+" / "+nights+" Nächte / "+guests+" Personen";
            var body = "Erwachsene: "+guests_adult + NL +
                "Kinder (bis 17): "+guests_children + NL + 
                "Kinder (bis 9): "+guests_children_free + NL + 
                "Name: "+name + NL + 
                "E-Mail: "+email + NL +
                "Telefon: "+phone + NL +
                "Bemerkung: "+note;

            
            window.location = "mailto:buchen@salztraeume-am-see.de?subject="+subject+"&body="+body;
        }
    });

    // enable tooltips booking
    $('[data-toggle="tooltip"]').tooltip();

});