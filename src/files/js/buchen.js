var FORM_MAILER_URL = 'https://sas-public.awspace.de/ext-api/website-form';
var PRICING_URL = 'https://sas-public.awspace.de/ext-api/pricing';

if (window.location.hostname === 'localhost') {
    FORM_MAILER_URL = '//localhost:5001/ext-api/website-form'
}

if (window.location.hostname === 'localhost') {
    PRICING_URL = '//localhost:5011/ext-api/pricing'
}

var DE_FORMATTER = 'DD.MM.YYYY';
var EN_FORMATTER = 'YYYY-MM-DD';
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

const DEFAULT_MIN_NIGHTS = 2;

//  +++ booking +++

var locationHash = {};
var PERMA_LINK_KEYS = [
    'date',
    'filter-SL',
    'filter-EH',
    'filter-FS',
    'filter-SW',
    'from',
    'to',
    'flat',
    'flat_d',
    'ga',
    'gb',
    'gc',
    'gd',
    'name',
    'email',
    'verify'
];

var setPermaLink = function(key, value) {
    if (key === 'filter') {
        var filterElement = $('input.filter-'+value);
        if (filterElement.length > 0) {
            var checkbox = filterElement[0].checked;
            return setPermaLink('filter-'+value, checkbox ? '' : null);
        }

    }
    if ('.' + PERMA_LINK_KEYS.join('.').indexOf(key) < 0) {
        throw new Error('there is no key: '+key);
    }
    locationHash[key] = value;

    var locationArray = [];
    // handle input filter
    for (var i=0; i<Object.keys(locationHash).length; i++) {
        var key = Object.keys(locationHash)[i];
        if (key.indexOf('filter-') !== -1) {
            if (PERMA_LINK_KEYS.indexOf(key) !== -1) {
                if ($('.'+key)[0].checked) {
                    locationArray.push(key);
                }
            }
        }
    }
    // handle rest
    for(var i=0; i<PERMA_LINK_KEYS.length; i++) {
        var currentKey = PERMA_LINK_KEYS[i];
        if (currentKey.indexOf('filter-') !== -1) {
            continue;
        }
        var currentVal = locationHash[currentKey];
        if ((currentVal != null && currentVal !== 0)) {
            if (!currentVal) { // for falsy values use just the key
                locationArray.push(currentKey);
            } else {
                locationArray.push(currentKey + '=' + currentVal);
            }
        }
    }
    window.location.hash = locationArray.join('&');
};

var parsePrice = function(str) {
    var regexp = /[^\d()+*]/g;
    var formula = str.replace(regexp, '');
    try {
        var result = eval(formula);
        if (result == null) {
            return 0;
        }
        return result;
    } catch (err) {
        return 0;
    }

};

var handleFilterFromURL = function(flatShortcut) {
    var setFilter = function(key) {
        $('input.filter-'+key).click();
    };
    setFilter(flatShortcut);
    setPermaLink('filter', flatShortcut);
};

var readPermaLink = function(options) {
    var str = window.location.hash.substr(1);
    var pairs = str.split('&');
    var filterHandled = false;

    for (var i=0; i<pairs.length; i++) {
        var splitted = pairs[i].split('=');
        var key = splitted[0];
        var value = splitted[1];
        locationHash[key] = value;

        if (options.init) {
            if (key === 'verify') continue;
        }
        if (options.finished) {
            if (key !== 'verify') continue;
        }
        switch(key) {
            case 'date':
                window.current = moment(value + '-01');
                clearCal();
                calcCalendar(window.current);
                updateItemsForCurrentMonth();
                break;
            case 'filter-SL':
                handleFilterFromURL('SL');
                filterHandled = true;
                break;
            case 'filter-EH':
                handleFilterFromURL('EH');
                filterHandled = true;
                break;
            case 'filter-FS':
                handleFilterFromURL('FS');
                filterHandled = true;
                break;
            case 'filter-SW':
                handleFilterFromURL('SW');
                filterHandled = true;
                break;
            case 'from':
                $('#b_arrival').val(value);
                break;
            case 'to':
                $('#b_departure').val(value);
                break;
            case 'flat':
                $('#b_flat').val(value);
                break;
            case 'ga':
                $('#b_guests_adult').val(value);
                break;
            case 'gb':
                $('#b_guests_teens').val(value);
                break;
            case 'gc1':
                $('#b_guests_childre1').val(value);
                break;
            case 'gc2':
                $('#b_guests_children2').val(value);
                break;
            case 'gd':
                $('#b_guests_children_free').val(value);
                break;
            case 'name':
                $('#b_name').val(value);
                break;
            case 'email':
                $('#b_email').val(value);
                break;
            case 'verify':
                console.log("WTF");
                break;
        }
    }
    var initialState = Array.prototype.slice.call($(".checker input")).every(function(input) {
        return input.checked == false;
    });
    if (initialState) {
        $('.filter-SL').click();
    }
    if ($('.conainter.booking').length > 0) {
        // only on the buchen.html
        limitDatePicker($('#b_arrival')[0]);
        if (!options.init) {
            calculatePrice();
            if (window.location.hash.indexOf('verify') !== -1) {
                var x = window.location.hash.split("&");
                var y = x[x.length-1].split("=");
                verify(y[1]);
            }
        }
    }
};

var verify = function(price) {
    var calculatedPrice = $("#price-sum").text();
    if (parseFloat(calculatedPrice) === parseFloat(price)) {
        $("body").css('background', 'green');
    } else {
        console.log('user', price);
        console.log('calculated', $("#price-sum").text());
        $("body").css('background', 'red');
    }
};

var calcGuestDates = function() {
    var from = $('#b_arrival').val() || '-';
    var to = $('#b_departure').val() || '-';
    var fromDate = moment(from, DE_FORMATTER);
    var toDate = moment(to, DE_FORMATTER);
    var nights = moment(toDate).diff(fromDate, 'days');
    setPermaLink('from', from);
    setPermaLink('to', to);

    return [nights, fromDate, toDate];
};

var calcTotalGuests = function() {
    var inputs = $('#guests_control input');
    if (inputs.length === 0) return

    var a = parseInt(inputs[0].value || 0);
    var b = parseInt(inputs[1].value || 0);
    var c = parseInt(inputs[2].value || 0);
    var d = parseInt(inputs[3].value || 0);
    var totalGuests = a+b+c+d;
    setPermaLink('ga', a);
    setPermaLink('gb', b);
    setPermaLink('gc', c);
    setPermaLink('gd', d);

    return totalGuests;
};

var calculatePrice = function() {
    // sum up total guests
    var totalGuests = calcTotalGuests();
    $('#b_guests_total').val(totalGuests);

    if ($("#arrival").val() === '' || $("#b_departure").val() === '') {
        resetCalculation();
        return;
    }
    if (totalGuests <= 0) {
        resetCalculation();
        return;
    }

    // flat and nights = base price
    var flatElement = $('#b_flat');
    var flatName = flatElement.val();
    setPermaLink('flat', flatName);
    var base = parseInt(flatElement.find("[value="+flatName+"]").attr('data-price'));
    var dates = calcGuestDates();
    var nights = dates[0];
    var fromDate = dates[1];
    var toDate = dates[2];


    var extraPersonSum = 0;
    var extraText = [];

    var accommodationShortname = $("#b_flat :selected").attr('data-location');

    const payload = {
        start: fromDate.format(EN_FORMATTER),
        end: toDate.format(EN_FORMATTER),
        accommodation: accommodationShortname,
        persons: {
            adult: parseInt($('#b_guests_adult').val() || 0),
            teen: parseInt($('#b_guests_teens').val() || 0),
            child2: parseInt($('#b_guests_children2').val() || 0),
            child1: parseInt($('#b_guests_children1').val() || 0),
            baby: parseInt($('#b_guests_children_free').val() || 0)
        }
    }
    $('#price-base').text('Preis wird berechnet...');
    var request = $.ajax({
        url: PRICING_URL,
        type: "POST",
        data: JSON.stringify(payload),
        contentType:"application/json; charset=utf-8"
    });

    request.done(function(json, responseType, xhr) {
        const result = xhr.responseJSON
        console.log(result)
        $('#price-base').text(result.base + ' €')
        if (result.extra != 0) {
            $('#price-extra-person').text(result.extra + ' €')
        } else {
            $('#price-extra-person').text('–')
        }
        $('#price-clean').text(result.service + ' €');
        $('#price-fee').text(result.taxfee + ' €')
        $('#price-sum').text(result.total + ' €')

        // validate flat size and show warning if needed
        const maxPersonsWarning = result.warnings.filter(function(e) { return e.type == 'maxPersons'})
        if (maxPersonsWarning.length > 0) {
            $('#b_guests_total').val(maxPersonsWarning[0].actual)
            $('#flat_size').val(maxPersonsWarning[0].expected)
            $('.guests-size').addClass('has-warning');
            $('label.size-overflow').show();
        } else {
            $('.guests-size').removeClass('has-warning');
            $('label.size-overflow').hide();
        }

        const minStayWarning = result.warnings.filter(function(e) { return e.type == 'minStay'})
        if (minStayWarning.length > 0) {
            $('#min-stay-value').text(minStayWarning[0].expected)
            $('.min-stay').show();
            $('.min-stay').addClass('has-error');
            window.validMinStay = false;
        } else {
            $('.min-stay').removeClass('has-error');
            $('.min-stay').hide();
            window.validMinStay = true;
        }
    });

    request.fail(function(xhr, responseType, statusText) {
        var message = (xhr.responseJSON || {}).message || 'Fehler bei der Preisberechnung';
        resetCalculation();
        $('#price-base').text(message);
        var content = parseJson(xhr.responseText).content || 'Preis konnte nicht abgefragt werden';
        if (content !== '') content = ': ' + content;
        console.log(content)
        payload._xhr = {
            readyState: xhr.readyState,
            responseText: xhr.responseText,
            status: xhr.status,
            hrstatusText: xhr.statusText
          }
        Raven.captureBreadcrumb({
          message: 'calculating price',
          category: 'action',
          data: payload
        });
        Raven.captureException(new Error('calculating price failed'))
        console.log('Raven.lastEventId()', Raven.lastEventId())
    });    
};

var resetCalculation = function() {
    $('#price-base').text('');
    $('#price-extra-person').text('');
    $('#price-extra-saison').text('');
    $('#price-clean').text('');
    $('#price-sum').text('');
    $('#price-fee').text('');
};

var getValidationLabel = function(referenceElement) {
    if ($(referenceElement).prev().is('label.validation')) {
        return $(referenceElement).prev()[0];
    }
    return $(referenceElement).parents('div.form-group').find('[for='+referenceElement.id+']')[0];
};

var extraValidation = function() {
    var returnValue = false;

    if (window.validMinStay == false) {
        return false
    }

    // check that at least one person is booked
    if (calcTotalGuests() <= 0) {
        $('.guests-size').addClass('has-error');
        $('label.size-underflow').show();
        return returnValue;
    } else {
        $('.guests-size').removeClass('has-error');
        $('label.size-underflow').hide();
    }

    // check if time and flat is available
    var location = $("#b_flat :selected").attr('data-location');
    if (checkAvailabilityFor(location, 1) === false) {
        alert('Die Wohnung ist für den angegebenen Zeitraum nicht verfügbar.');
        return false;
    }

    return true;
};

var checkAvailabilityFor = function(flatShortCut, check) {
    if (check != 1) return true;

    var start = moment($("#b_arrival").val(), DE_FORMATTER);
    var end = moment($("#b_departure").val(), DE_FORMATTER);
    while (start.format(DE_FORMATTER) !== end.format(DE_FORMATTER)) {
        var key = start.format('YYYY-MM-DD') + '_' + flatShortCut;
        if (window.blockingMap[key]) {
            return false;
        }
        start.add(1, 'days');
    }
    return true;
}

var limitDatePicker = function(element) {
    // limit the start date of departure
    // at least to book 2 nights
    var arrivalDate = moment(element.value, DE_FORMATTER);
    var departureDate = moment($('#b_departure').val(), DE_FORMATTER);

    checkNights(arrivalDate, departureDate, DEFAULT_MIN_NIGHTS);
};

var checkNights = function(arrivalDate, departureDate, minNights) {
    var minDeparture = moment(arrivalDate).add(minNights, 'days');
    _datepickers.pickers[1].setStartDate(minDeparture.format(DE_FORMATTER));

    // check if the old departure is still valid
    if (departureDate && departureDate.isBefore(minDeparture)) {
        $('#b_departure').val('');
    }
};


$(document).ready(function() {
    var id = setInterval(function() {
        // waiting until calendar items are loaded
        if (window.tableTemplate != null) {
            clearInterval(id);
            initializeBookingPage()
        }
    }, 100);
})

function initializeBookingPage() {
    //  +++ booking +++

    window.current = moment();
    DATEPICKER_OPTS.startDate = window.current.format(DE_FORMATTER);
    $(DATEPICKER_SELECTOR).datepicker(DATEPICKER_OPTS);

    // read initial url params
    readPermaLink({init: true});

    if ($('#b_arrival').length > 0) {
        $('.calendar').on('click', '.booking-calendar .day', function() {
            $('html, body').animate({
                scrollTop: $('#header-title').offset().top - 60
            }, 1000);
            setTimeout(function() {
                $('#b_arrival').focus();
            }, 1000);
        });
    }


    $('#b_flat').on('change', function(event) {
        const element = event.target
        const maxValue = $(element).find("[value="+element.value+"]").attr('data-max');
        $('#flat_size').val(maxValue);
        calculatePrice();
    });

    $('#guests_control input').on('change', function(e) {
        calculatePrice();
    });

    previousDepartureValue = null;
    $('#b_arrival').on('change', function(e) {
        if (e.target.value === previousDepartureValue) {
            // datepicker bug: https://github.com/eternicode/bootstrap-datepicker/issues/912
            return;
        }
        limitDatePicker(e.target);
        calculatePrice();
        previousDepartureValue = e.target.value;
    });

    previousArrivalValue = null;
    $('#b_departure').on('change', function(e) {
        if (e.target.value === previousArrivalValue) {
            // datepicker bug: https://github.com/eternicode/bootstrap-datepicker/issues/912
            return;
        }
        calculatePrice();
        previousArrivalValue = e.target.value;
    });

    // blur immediately to avoid ios android keyboard overlay
    $('#b_arrival, #b_departure').on('click', function(e) {
        e.target.blur();
    });

    $('#b_submit').on('click', function(e) {
        e.preventDefault();

        var data = prepareSubmit();
        if (data != null) {
            Raven.context(function() {
                doSubmit(data);
            })
        }
    });

    // enable tooltips
    $('[data-toggle="tooltip"]').tooltip();

    readPermaLink({finished: true});

}

var prepareSubmit = function() {
    // remove validation errors if there were some

    if (!extraValidation()) return;

    $('div.form-group.has-error').removeClass('has-error');
    
    var form = $('.conainter.booking')[0];

    let foundIsValid = true;
    const foundValue = $('#b_found').val();
    if (foundValue == null || foundValue == '') {
        $('label.found').text('Bitte auswählen').show().parent().addClass('has-error');
        foundIsValid = false;
    }
    if (form.checkValidity && !form.checkValidity()) {
        var inputs = form.querySelectorAll("input");
        for (var i=0; i<inputs.length; i++) {
            var tmp = inputs[i];
            if (!tmp.validity.valid) {
                var msg = tmp.validationMessage;
                var validation = $(getValidationLabel(tmp));
                validation.text(msg);
                $(tmp).parents('div.form-group').addClass('has-error');
            }
        }
        return null;
    } else {
        if (!extraValidation()) return;
        if (!foundIsValid) return;
        var dates = calcGuestDates();

        // --------------------------------------
        // form data
        var flat_name = $('#b_flat').val();
        var from = $('#b_arrival').val();
        var to = $('#b_departure').val();
        from = moment(from, DE_FORMATTER).format(EN_FORMATTER);
        to = moment(to, DE_FORMATTER).format(EN_FORMATTER);
        var guests = $('#b_guests_total').val();
        var guests_adult = $('#b_guests_adult').val() || null;
        var guests_teens = $('#b_guests_teens').val() || null;
        var guests_children1 = $('#b_guests_children1').val() || null;
        var guests_children2 = $('#b_guests_children2').val() || null;
        var guests_children_free = $('#b_guests_children_free').val() || null;
        var voucherCode = $('#b_code').val() || null;

        var firstname = $('#b_firstname').val();
        var name = $('#b_name').val();
        var email = $('#b_email').val();
        var send_email = $('#b_send_email').prop('checked');
        var phone = $('#b_phone').val() || null;
        var note = $('#b_note').val() || null;
        var found = $('#b_found').val();
        var gender = $('[name=b_gender]:checked').val();
        var tvDistinction = $('#b_tv-distinction').prop('checked');

        var data = {
            flat_name: flat_name,
            from: from,
            to: to,
            guests: parseInt(guests) || 0,
            guests_adult: parseInt(guests_adult) || 0,
            guests_teens: parseInt(guests_teens) || 0,
            guests_children1: parseInt(guests_children1) || 0,
            guests_children2: parseInt(guests_children2) || 0,
            guests_children_free: parseInt(guests_children_free) || 0,
            voucherCode: voucherCode,
            gender: gender,
            tvDistinction: tvDistinction,
            firstname: firstname,
            name: name,
            email: email,
            send_email: send_email,
            phone: phone,
            note: note,
            found: found,
            user_url: 'http://' + window.location.host + window.location.pathname + window.location.hash
      };
      return data;
    }
}

var doSubmit = function(data) {
    var submitButton = $('#b_submit');
    submitButtonOriginalText = submitButton.text();
    submitButton.text('Bitte warten ...');
    submitButton[0].disabled = true;

    Raven.setUserContext({
        firstname: data.firstname,
        name: data.name,
        email: data.email,
    });
    var request = $.ajax({
        url: window.FORM_MAILER_URL || FORM_MAILER_URL,
        type: "POST",
        data: data,
        dataType: 'json'
    });

    request.done(function(json, responseType, xhr) {
        alert('Anfrage erfolgreich verschickt');
        console.log(xhr);
        submitButton[0].disabled = true;
        var content = parseJson(xhr.responseText).content || '';
        submitButton.text('Abgeschickt, Referenz-Nr: ' + content);
    });

    request.fail(function(xhr, responseType, statusText) {
        var content = parseJson(xhr.responseText).content || 'Anfrage konnte nicht gesendet werden, der Administrator wird darüber automatisch informiert';
        if (content !== '') content = ': ' + content;
        alert('FEHLER' + content);
        submitButton.text(submitButtonOriginalText);
        submitButton[0].disabled = false;
        console.log(xhr);
        data._xhr = {
            readyState: xhr.readyState,
            responseText: xhr.responseText,
            status: xhr.status,
            hrstatusText: xhr.statusText
          }
        Raven.captureBreadcrumb({
          message: 'sending inquiry',
          category: 'action',
          data: data
        });
        Raven.captureException(new Error('inquiry sending failed'))
        console.log('Raven.lastEventId()', Raven.lastEventId())
    });
}

var parseJson = function(string) {
    var json = {};
    try {
        json = JSON.parse(string);
    } catch (err){}
    return json;
};

