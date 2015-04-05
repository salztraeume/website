var CLEAN_BASE = 30;
var DE_FORMATTER = 'DD.MM.YYYY';
var EN_FORMATTER = 'YYYY-MM-DD'
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
SAISONS = [
    {
        name: 'summer',
        start: '01.06',
        duration: moment('2000-08-31').diff(moment('2000-06-01'), 'days'),
        nights: 4,
        type: 'fix-offset',
        amount: 5
    },
    {
        name: 'winter',
        start: '23.12',
        duration: moment('2001-01-03').diff(moment('2000-12-23'), 'days'),
        nights: 4,
        type: 'fix-offset',
        amount: 15
    }
];

DEFAULT_MIN_NIGHTS = 2;
FUCHS_FULLHOUSE_BASE = 90; // 3 (each room) * 20 € + 30 € = 90
FUCHS_FULLHOUSE_PERSON_THRESHOLD = 5;

var NL = NEWLINE = "%0D%0A";
var LOCAL_STORAGE_KEY = 'salttraeume_rsp';
//  +++ booking +++

var locationHash = {};
var PERMA_LINK_KEYS = [
    'filter-SL',
    'filter-EH',
    'filter-F1',
    'filter-F2',
    'filter-F3',
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
    if (flatShortcut === 'FS') {
        setFilter('F1');
        setFilter('F2');
        setFilter('F3');
        setPermaLink('filter', 'FS');
    } else {
        setFilter(flatShortcut);
        setPermaLink('filter', flatShortcut);
    }
};

var readPermaLink = function(options) {
    var str = window.location.hash.substr(1);
    var pairs = str.split('&');
    var filterHandled = false;

    // prophylactic reset
    $('#flat_fuchs_detail').hide();
    
    for (var i=0; i<pairs.length; i++) {
        var splitted = pairs[i].split('=');
        var key = splitted[0];
        var value = splitted[1];
        locationHash[key] = value;

        if (key === 'RSP') {
            if (value === 'off' || value === '0') {
                localStorage.setItem(LOCAL_STORAGE_KEY, null);
                console.log('reservation-view disabled');
            } else {
                localStorage.setItem(LOCAL_STORAGE_KEY, 'on');
                console.log('reservation-view activated');
            }
        }
        if (options.init) {
            if (key === 'verify') continue;
        }
        if (options.finished) {
            if (key !== 'verify') continue;
        }
        switch(key) {
            case 'filter-SL':
                handleFilterFromURL('SL');
                filterHandled = true;
                break;
            case 'filter-EH':
                handleFilterFromURL('EH');
                filterHandled = true;
                break;
            case 'filter-F1':
                handleFilterFromURL('F1');
                filterHandled = true;
                break;
            case 'filter-F2':
                handleFilterFromURL('F2');
                filterHandled = true;
                break;
            case 'filter-F3':
                handleFilterFromURL('F3');
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
            case 'flat_d':
                if (locationHash.flat != 'Fuchs') {break;}

                flat_values = value.split('').map(function(i) {return i === '1' ? true : false});
                $('#flat_fuchs_detail input')[0].checked = flat_values[0];
                $('#flat_fuchs_detail input')[1].checked = flat_values[1];
                $('#flat_fuchs_detail input')[2].checked = flat_values[2];
                $('#flat_fuchs_detail').show();
                break;
            case 'ga':
                $('#b_guests_adult').val(value);
                break;
            case 'gb':
                $('#b_guests_teens').val(value);
                break;
            case 'gc':
                $('#b_guests_children').val(value);
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
                verify(value);
                break;
        }
    }
    if (!filterHandled && $(".checker input").filter(function(i, input){return input.checked}).length === 0) {
        $('.filter-SL').click();
    }
    if ($('.conainter.booking').length > 0) {
        // only on the buchen.html
        toggleFlatDetails($('#b_flat')[0], true);
        limitDatePicker($('#b_arrival')[0]);
        calculatePrice();
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
    // validte flat size and show warning if needed
    if (totalGuests > parseInt($('#flat_size').val())) {
        $('.guests-size').addClass('has-warning');
        $('label.size-overflow').show();
    } else {
        $('.guests-size').removeClass('has-warning');
        $('label.size-overflow').hide();
    }

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

    var extraTreshold = 0;

    // sepcial logic for fuchs rooms
    if (flatName === 'Fuchs') {
        var values = getDetailsForFuchs();
        var result = values[0] + values[1] + values[2];
        setPermaLink('flat_d', ('' + values[0]) + values[1] + values[2]);
        if (result === 0) {
            resetCalculation();
            return;
        } 
        if (result < 3) {
            extraTreshold = result;
            base = base * result;
        } else {
            // full house
            extraTreshold = FUCHS_FULLHOUSE_PERSON_THRESHOLD;
            base = FUCHS_FULLHOUSE_BASE;
        }

    } else {
        // Schmetterling and Eichhoernchen
        extraTreshold = 2;
    }

    $('#price-base').text(nights + ' Nächte * ' + base + ' €');

    var toSubtract = extraTreshold;
    
    var extraPersonSum = 0;
    var extraText = [];
    var fee = 0;

    var map = {
        adult: {
            size: parseInt($('#b_guests_adult').val()),
            price: parseInt($('#b_guests_adult').attr('data-price')),
            fee: 2
        },
        teens: {
            size: parseInt($('#b_guests_teens').val()),
            price: parseInt($('#b_guests_teens').attr('data-price')),
            fee: 1
        },
        children: {
            size: parseInt($('#b_guests_children').val()),
            price: parseInt($('#b_guests_children').attr('data-price')),
            fee: 0
        },
        babies: {
            size: parseInt($('#b_guests_children_free').val()),
            price: parseInt($('#b_guests_children_free').attr('data-price')),
            fee: 0
        }
    };
    var array = ['adult', 'teens', 'children', 'babies'];

    // calc fee
    for (var i=0; i<array.length; i++) {
        var tmp = map[array[i]];
        if (tmp.size > 0) {
            fee += tmp.size * tmp.fee;
        }
    }

    // calc extra persons
    if (totalGuests > extraTreshold) {
        // compensate the person inclusive amount
        for (var i=0; i<array.length; i++) {
            var personGroup = array[i];
            var tmp = map[personGroup];
            if (tmp.size > 0) {
                while (tmp.size > 0 && toSubtract > 0) {
                    tmp.size--;
                    toSubtract--;
                }
            }
        }
        // the add now the extra costs
        for (var i=0; i<array.length; i++) {
            var personGroup = array[i];
            if (personGroup === 'babies') continue;
            var tmp = map[personGroup];
            if (tmp.size > 0 && tmp.price > 0) {
                extraText.push(tmp.size + ' P. * ' + tmp.price + ' €');
                extraPersonSum += tmp.size * tmp.price;
            }
        }
        
        // special offer 8 persons for fuchs = 120 €
        if (totalGuests > 7 && extraPersonSum > (120 - base)) {
            extraPersonSum = 30;
            extraText = ['Fullhouse Rabatt: 30 €'];
        }
    } 
    if (extraText.length > 0) {
        $('#price-extra-person').text(nights + ' Nächte * (' + extraText.join(' + ')+')');
    } else {
        $('#price-extra-person').text('–');
    }

    // clean
    var extraClean = 0;
    if (totalGuests > 4) {
        extraClean = (totalGuests - 4) * 5;
    }
    var totalClean = CLEAN_BASE + extraClean;
    $('#price-clean').text(totalClean + ' €');

    // special costs
    // check if the daterange is within a saison
    var saisonSpecial = 0;
    var saisonDays = 0;
    var saisonPrice = 0;
    for (var i=0; i<SAISONS.length; i++) {
        var saison = SAISONS[i];
        var currentYear = moment().year();
        var specialPriceStart = moment(saison.start + '.' + currentYear, DE_FORMATTER).subtract(1, 'day');
        var specialPriceEnd = moment(specialPriceStart).add(saison.duration + 1, 'days');
        var specialPriceStartNext = moment(specialPriceStart).add('year', 1);
        var specialPriceEndNext = moment(specialPriceEnd).add('year', 1);
        if (saison.type !== 'fix-offset') {
            console.log(new Error('cannot handle saison type: '+saison.type));
            alert('Entschuldigung, es ist ein Fehler aufgetreten (CODE: 101)');
            return;
        }

        var tmpDate = moment(fromDate);
        while (isBefore(tmpDate, toDate)) {
            if (isAfter(tmpDate, specialPriceStart) && isBefore(tmpDate, specialPriceEnd)) {
                // check current year
                saisonSpecial += saison.amount;
                saisonPrice = saison.amount;
                saisonDays++;
            } else if(isAfter(tmpDate, specialPriceStartNext) && isBefore(tmpDate, specialPriceEndNext)) {
                // check for next year
                saisonSpecial += saison.amount;
                saisonPrice = saison.amount;
                saisonDays++;
            } else {
                saisonSpecial += 0;
            }
            // increment for loop
            tmpDate.add(1, 'days');
        }
    }

    if (saisonSpecial > 0) {
        $('.price-extra-saison').show();
        $('#price-extra-saison').text(saisonDays + ' Nächte * ' + saisonPrice + ' €');
    } else {
        $('#price-extra-saison').text('');
        $('.price-extra-saison').hide();
    }

    // total price
    $('#price-sum').text((base*nights + saisonSpecial + extraPersonSum*nights + totalClean) + ' €');

    // fee
    $('#price-fee').text(fee*nights + ' €');


    if (localStorage.getItem(LOCAL_STORAGE_KEY) === 'on') {
        showReservation();
    }
};

var resetCalculation = function() {
    $('#price-base').text('');
    $('#price-extra-person').text('');
    $('#price-extra-saison').text('');
    $('#price-clean').text('');
    $('#price-sum').text('');
    $('#price-fee').text('');
};

var getDetailsForFuchs = function() {
    var inputs = $('#flat_fuchs_detail input');
    var values = inputs.map(function(i, e) {return e.checked === false ? 0 : 1});
    return values;
};

var getValidationLabel = function(referenceElement) {
    if ($(referenceElement).prev().is('label.validation')) {
        return $(referenceElement).prev()[0];
    }
    return $(referenceElement).parents('div.form-group').find('[for='+referenceElement.id+']')[0];
};

var extraValidation = function() {
    // check that at least one person is booked
    if (calcTotalGuests() <= 0) {
        $('.guests-size').addClass('has-error');
        $('label.size-underflow').show();
        return false;
    } else {
        $('.guests-size').removeClass('has-error');
        $('label.size-underflow').hide();
    }

    // check if at least one room for fuchs was checked
    var flatDetails = getDetailsForFuchs();
    var flat = $('#b_flat').val();
    if (flat === 'Fuchs' && flatDetails[0] + flatDetails[1] + flatDetails[2] <= 0) {
        $('#flat_fuchs_detail').addClass('has-error');
        return false;
    } else {
        $('#flat_fuchs_detail').removeClass('has-error');
    }

    return true;
};

var limitDatePicker = function(element) {
    // limit the start date of departure
    // at least to book 2 nights
    var arrivalDate = moment(element.value, DE_FORMATTER);
    var departureDate = moment($('#b_departure').val(), DE_FORMATTER);

    checkNights(arrivalDate, departureDate, DEFAULT_MIN_NIGHTS);

    for (var i=0; i<SAISONS.length; i++) {
        var saison = SAISONS[i];
        var saisonStart = saison.start.split('.').map(function(i) {
            return parseInt(i);
        });
        var saisonStartDate = moment(arrivalDate).month(saisonStart[1]-1).date(saisonStart[0]).add(2, 'day');
        // extra check for winter saison, year change
        if (arrivalDate.months() === 0) {
            // if arrival is January
            saisonStartDate.subtract(1, 'year');
        } 
        var saisonEndDate = moment(saisonStartDate).add(saison.duration - 2, 'days');

        var tmp = moment(arrivalDate).add('days', saison.nights);
        if (tmp.diff(saisonStartDate) >= 0 && tmp.diff(saisonEndDate) <= 0 ||
            arrivalDate.diff(saisonStartDate) >= 0 && arrivalDate.diff(saisonEndDate) <= 0) {
            checkNights(arrivalDate, departureDate, saison.nights);
        }
    }
};

var checkNights = function(arrivalDate, departureDate, minNights) {
    var minDeparture = moment(arrivalDate).add('days', minNights);
    _datepickers.pickers[1].setStartDate(minDeparture.format(DE_FORMATTER));

    // check if the old departure is still valid
    if (departureDate && departureDate.isBefore(minDeparture)) {
        $('#b_departure').val('');
    }
};


// toggle flat details
// adapt flat size
var toggleFlatDetails = function(element, noPermaLink) {
    var flatSize = 0;
    if (element.value === 'Fuchs') {
        $('#flat_fuchs_detail').show();
        var values = getDetailsForFuchs();
        var result = values[0] + values[1] + values[2];
        // set max room
        if (values[0]) flatSize += 4; // 4 beds
        if (values[1]) flatSize += 2; // 1 double bed
        if (values[2]) flatSize += 2; // 1 double bed
        if (result === 3) flatSize += 2; // 2 couch
    } else {
        // disable all checkboxes for fuchs
        $('#flat_fuchs_detail input').prop("checked", false);
        $('#flat_fuchs_detail').hide();
        flatSize = $(element).find("[value="+element.value+"]").attr('data-max');
        if (!noPermaLink) setPermaLink('flat_d', null);
    }
    $('#flat_size').val(flatSize);
};

$(document).ready(function() {

    //  +++ booking +++

    window.current = moment();
    DATEPICKER_OPTS.startDate = window.current.format(DE_FORMATTER);
    $(DATEPICKER_SELECTOR).datepicker(DATEPICKER_OPTS);

    // read initial url params
    readPermaLink({init: true});

    if ($("#b_arrival").length > 0) {
        $(".booking-calendar .day").on('click', function() {
            $('html, body').animate({
                scrollTop: $("#header-title").offset().top - 60
            }, 1000);
            setTimeout(function() {
                $('#b_arrival').focus();
            }, 1000);
        });
    }


    $('#b_flat').on('change', function(event) {
        toggleFlatDetails(event.target);
        calculatePrice();
    });

    $('#flat_fuchs_detail input').on('change', function(e) {
        toggleFlatDetails($('#b_flat')[0]);
        calculatePrice();
    });

    $('#b_arrival').on('change', function(event) {
        limitDatePicker(event.target);
        calculatePrice();
    });

    $('#guests_control input, #b_departure').on('change', function(e) {
        calculatePrice();
    });

    // blur immediately to avoid ios android keyboard overlay
    $('#b_arrival, #b_departure').on('click', function(e) {
        e.target.blur();
    });

    $('#b_submit').on('click', function(e) {
        e.preventDefault();

        var data = prepareSubmit();
        if (data != null) {
            doSubmit(data);
        }
    });

    // enable tooltips
    $('[data-toggle="tooltip"]').tooltip();

    readPermaLink({finished: true});

});

var prepareSubmit = function() {
    // remove validation errors if there were some
    $('div.form-group.has-error').removeClass('has-error');

    extraValidation();

    var form = $('.conainter.booking')[0];
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

        var dates = calcGuestDates();

        // --------------------------------------
        // form data
        var flat_name = $('#b_flat').val();
        var from = $('#b_arrival').val();
        var to = $('#b_departure').val();
        from = moment(from, DE_FORMATTER).format(EN_FORMATTER);
        to = moment(to, DE_FORMATTER).format(EN_FORMATTER);
        var nights = dates[0];
        var guests = $('#b_guests_total').val();
        var guests_adult = $('#b_guests_adult').val() || null;
        var guests_teens = $('#b_guests_teens').val() || null;
        var guests_children = $('#b_guests_children').val() || null;
        var guests_children_free = $('#b_guests_children_free').val() || null;

        var price_Basic_ = parsePrice($('#price-base').text());
        var price_Saison_ = parsePrice($('#price-extra-saison').text());
        var price_basic = price_Basic_ + price_Saison_;
        var price_extra_persons = parsePrice($('#price-extra-person').text());
        var price_clean = parsePrice($('#price-clean').text());
        var price_fee = parsePrice($('#price-fee').text());
        var price_total = parsePrice($('#price-sum').text());

        var name = $('#b_name').val();
        var email = $('#b_email').val();
        var send_email = $('#b_send_email').prop('checked');
        var phone = $('#b_phone').val() || null;
        var note = $('#b_note').val() || null;
        var found = $('#b_found').val();
        var flat_details_text = '';
        // --------------------------------------

        var flatDetails = getDetailsForFuchs();
        flat_details_text = '';
        if (flatDetails[0] + flatDetails[1] + flatDetails[1] > 0) {
            var tmp = '';
            tmp +=  flatDetails[0] ? ' 1. ' : '';
            tmp +=  flatDetails[1] ? ' 2. ' : '';
            tmp +=  flatDetails[2] ? ' 3. ' : '';
            flat_details_text = "Fuchs Zimmer:" + tmp;
        }
        // --------------------------------------
        
        var data = {
            flat_name: flat_name,
            flat_details_text: flat_details_text,
            from: from,
            to: to,
            nights: nights,
            guests: guests,
            guests_adult: guests_adult,
            guests_teens: guests_teens,
            guests_children: guests_children,
            guests_children_free: guests_children_free,
            price_basic: price_basic,
            price_extra_persons: price_extra_persons,
            price_clean: price_clean,
            price_fee: price_fee,
            price_total: price_total,
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
    var formUrl = 'http://thunderwave.de:9771/submit';

    var request = $.ajax({
        url: formUrl,
        type: "POST",
        data: data,
        dataType: 'json'
    });
     
    request.done(function(json, responseType, xhr) {
        alert('Anfrage erfolgreich verschickt. Sie bekommen in wenigen Minuten eine E-Mail.');
        console.log(xhr);
        submitButton[0].disabled = true;
        var content = parseJson(xhr.responseText).content || '';
        submitButton.text('Abgeschickt, Referenz-Nr: ' + content);
    });
     
    request.fail(function(xhr, responseType, statusText) {
        var content = parseJson(xhr.responseText).content || 'Entschuldigung, bitte versuchen Sie es später noch einmal';
        if (content !== '') content = ': ' + content;
        alert('Anfrage konnte nicht gesendet werden' + content);
        submitButton.text(submitButtonOriginalText);
        submitButton[0].disabled = false;
        console.log(xhr);
    });
}

var parseJson = function(string) {
    var json = {};
    try {
        json = JSON.parse(string);
    } catch (err){}
    return json;
};

var showReservation = function() {
    var data = prepareSubmit();
    /*
    ignore: 
          "send_email": true,
          "phone": null,
          "note": null,
          "found": "-",
    */
    data = $(data)
        .removeProp('send_email')
        .removeProp('phone')
        .removeProp('note')
        .removeProp('found')
        .removeProp('user_url')
        .removeProp('name')
        .removeProp('email')
        [0]

    var jsonData = JSON.stringify(data, null, 2);
    var content = '<div class="container"><pre>' + jsonData +  '</pre></div>';
    $('#reservation').html(content);
}