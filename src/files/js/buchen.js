var CLEAN_BASE = 30;
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
];

var setPermaLink = function(key, value) {
    if (key === 'filter') {
        var checkbox = $('input.filter-'+value)[0].checked;
        return setPermaLink('filter-'+value, checkbox ? '1' : null);
    }
    if ('.' + PERMA_LINK_KEYS.join('.').indexOf(key) < 0) {
        throw new Error('there is no key: '+key);
    }
    locationHash[key] = value;

    var locationArray = [];
    for(var i=0; i<PERMA_LINK_KEYS.length; i++) {
        var currentKey = PERMA_LINK_KEYS[i];
        var currentVal = locationHash[currentKey];
        if (currentVal != null && currentVal !== '' && currentVal !== 0) {
            locationArray.push(currentKey + '=' + currentVal);
        }
    }
    window.location.hash = locationArray.join('&');
};

var parsePrice = function(str) {
    var stripped = str.replace(/\D/g,' ');
    var splitted = stripped.split(' ');
    var factors = [];
    for (var i=0; i<splitted.length; i++) {
        var tmp = splitted[i];
        if (tmp != '') {
            factors.push(parseInt(tmp));
        }
    }
    var price = 0;
    for (var i=0; i<factors.length; i++) {
        var tmp = factors[i];
        if (price === 0) {
            // for the first factor
            price = 1;
        }
        price *= tmp;
    }
    return price;
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

var readPermaLink = function() {
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
        }
    }
    if (!filterHandled) {
        handleFilterFromURL('SL');
    }
    calculatePrice();
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
        
        if (result === 0) {
            resetCalculation();
            return;
        } 
        extraTreshold = result;
        base = base * result;

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
            var tmp = map[array[i]];
            if (tmp.size > 0) {
                while (tmp.size > 0 && toSubtract > 0) {
                    tmp.size--;
                    toSubtract--;
                }
            }
        }
        // the add now the extra costs
        for (var i=0; i<array.length; i++) {
            var tmp = map[array[i]];
            if (tmp.size > 0 && tmp.price > 0) {
                extraText.push(tmp.size + ' * ' + tmp.price + ' €');
                extraPersonSum += tmp.size * tmp.price;
            }
        }
        
        // special offer 8 persons for fuchs = 120 €
        if (totalGuests > 7 && extraPersonSum > (120 - base)) {
            extraPersonSum -= map.adult.price;
            extraText.push('Aktions Rabatt');
        }

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
    // check if the daterange is within summer special prices
    var saisonSpecial = 0;
    var saisonDays = 0;
    var currentYear = moment().year();
    var specialPriceStart = moment('01.06' + currentYear, DE_FORMATTER).subtract('day', 1);
    var specialPriceEnd = moment('31.08' + currentYear, DE_FORMATTER).add('day', 1);
    var specialPriceStartNext = moment(specialPriceStart).add('year', 1);
    var specialPriceEndNext = moment(specialPriceEnd).add('year', 1);

    var tmpDate = moment(fromDate);
    while (isBefore(tmpDate, toDate)) {
        if (isAfter(tmpDate, specialPriceStart) && isBefore(tmpDate, specialPriceEnd)) {
            // check current year
            saisonSpecial += 5;
            saisonDays++;
        } else if(isAfter(tmpDate, specialPriceStartNext) && isBefore(tmpDate, specialPriceEndNext)) {
            // check for next year
            saisonSpecial += 5;
            saisonDays++;
        } else {
            saisonSpecial += 0;
        }
        // increment for loop
        tmpDate.add(1, 'days');
    }
    if (saisonSpecial > 0) {
        $('.price-extra-saison').show();
        $('#price-extra-saison').text(saisonDays + ' Nächte * 5 €');
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
    if (flat === 'Fuchs' && flatDetails[0] + flatDetails[1] + flatDetails[1] <= 0) {
        $('#flat_fuchs_detail').addClass('has-error');
        return false;
    } else {
        $('#flat_fuchs_detail').removeClass('has-error');
    }

    return true;
};

$(document).ready(function() {

    //  +++ booking +++

    window.current = moment();
    DATEPICKER_OPTS.startDate = window.current.format(DE_FORMATTER);
    $(DATEPICKER_SELECTOR).datepicker(DATEPICKER_OPTS);

    // read initial url params
    readPermaLink();

    //

    $('#b_flat').on('change', function(e) {
        if (e.target.value === 'Fuchs') {
            $('#flat_fuchs_detail').show();
            $('#flat_size').val("");
        } else {
            // disable all checkboxes for fuchs
            $('#flat_fuchs_detail input').prop("checked", false);
            $('#flat_fuchs_detail').hide();
            var flatSize = $(e.target).find("[value="+e.target.value+"]").attr('data-max');
            $('#flat_size').val(flatSize);
            setPermaLink('flat_d', null);
        }
        calculatePrice();
    });

    $('#flat_fuchs_detail input').on('change', function(e) {
        var values = getDetailsForFuchs();
        var result = values[0] + values[1] + values[2];
        setPermaLink('flat_d', ('' + values[0]) + values[1] + values[2]);
        // set max room
        var flatSize = 0;
        if (values[0]) flatSize += 4; // 4 beds
        if (values[1]) flatSize += 2; // 1 double bed
        if (values[2]) flatSize += 2; // 1 double bed
        if (result === 3) flatSize += 1; // 1 couch
        $('#flat_size').val(flatSize);

        calculatePrice();
    });

    $('#b_arrival').on('change', function(e) {
        // limit the start date of departure
        // at least to book 2 nights
        var arrivalDate = e.target.value;
        var minDeparture = moment(arrivalDate, DE_FORMATTER).add('days', 2);
        _datepickers.pickers[1].setStartDate(minDeparture.format(DE_FORMATTER));

        // check if the old departure is still valid
        var departureDate = moment($('#b_departure').val(), DE_FORMATTER);
        if (departureDate && departureDate.isBefore(minDeparture)) {
            $('#b_departure').val('');
        }

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
            
        } else {
            if (!extraValidation()) return;

            var flatName = $('#b_flat').val() || '-';
            var from = $('#b_arrival').val() || '-';
            var to = $('#b_departure').val() || '-';
            var dates = calcGuestDates();
            var nights = dates[0];
            var guests = $('#b_guests_total').val() || '-';
            var guests_adult = $('#b_guests_adult').val() || '-';
            var guests_teens = $('#b_guests_teens').val() || null;
            var guests_children = $('#b_guests_children').val() || null;
            var guests_children_free = $('#b_guests_children_free').val() || null;
            var name = $('#b_name').val() || '-';
            var email = $('#b_email').val() || '-';
            var phone = $('#b_phone').val() || null;
            var note = $('#b_note').val() || null;

            
            var subject = "Buchung: "+from+" — "+to+" / "+nights+" Übernachtungen in " + flatName + " / "+guests+" Personen";
            var flatDetails = getDetailsForFuchs();
            var flatDetailsText = '';
            if (flatDetails[0] + flatDetails[1] + flatDetails[1] > 0) {
                var tmp = '';
                tmp +=  flatDetails[0] ? ' 1. ' : '';
                tmp +=  flatDetails[1] ? ' 2. ' : '';
                tmp +=  flatDetails[2] ? ' 3. ' : '';
                flatDetailsText = "Fuchs Zimmer:"+tmp + NL;
            }

            var body = 
                "Zeitraum: " + from + " — " + to + NL +
                "Übernachtungen: " + nights + NL +
                "Wohnung: " + flatName + NL + flatDetailsText +
                "Erwachsene: "+guests_adult + NL;

            if (guests_teens) body += "Kinder (bis 17): "+guests_teens + NL;
            if (guests_children) body += "Kinder (bis 9): "+guests_children + NL;
            if (guests_children_free) body += "Kinder (bis 4): "+guests_children_free + NL;
            
            body += NL + 
                "Preis: " + $('#price-sum').text() + NL;

            body += "Personen insgesamt: " + guests + NL +
                NL +
                "Name: "+name + NL + 
                "E-Mail: "+email + NL;

            if (phone) body += "Telefon: "+phone + NL;
            if (note) body += "Bemerkung: "+note;

            window.location = "mailto:hej@salztraeume-am-see.de?subject="+subject+"&body="+body;
        }
    });

    // enable tooltips
    $('[data-toggle="tooltip"]').tooltip();

});

var showReservation = function() {
    var NL = '<br/>';

    var flatName = $('#b_flat').val() || '-';
    var from = $('#b_arrival').val() || '-';
    var to = $('#b_departure').val() || '-';
    var dates = calcGuestDates();
    var nights = dates[0];
    var guests = $('#b_guests_total').val() || '-';
    var guests_adult = $('#b_guests_adult').val() || '-';
    var guests_teens = $('#b_guests_teens').val() || '-';
    var guests_children = $('#b_guests_children').val() || '-';
    var guests_children_free = $('#b_guests_children_free').val() || '-';

    var priceSuffix = ',00 Euro';
    var priceBasic = parsePrice($('#price-base').text()) + priceSuffix;
    var priceTotal = parsePrice($('#price-sum').text()) + priceSuffix;
    var priceExtrPersons = parsePrice($('#price-extra-person').text()) + priceSuffix;
    var priceClean = parsePrice($('#price-clean').text()) + priceSuffix;
    var priceFee = parsePrice($('#price-fee').text()) + priceSuffix;
    var pricePart = parsePrice($('#price-sum').text()) * 0.2 + priceSuffix;
    var priceRest = parsePrice($('#price-sum').text()) * 0.8  + priceSuffix;
    var priceRestDate = moment(from, DE_FORMATTER).subtract('day', 13).format(DE_FORMATTER);
    
    var flatDetails = getDetailsForFuchs();
    var flatDetailsText = '';
    if (flatDetails[0] + flatDetails[1] + flatDetails[1] > 0) {
        var tmp = '';
        tmp +=  flatDetails[0] ? ' 1. ' : '';
        tmp +=  flatDetails[1] ? ' 2. ' : '';
        tmp +=  flatDetails[2] ? ' 3. ' : '';
        flatDetailsText = "Fuchs Zimmer:"+tmp + NL;
    }
    
    var template = 'Hallo XX YY,' + NL + 
        NL + 
        'gerne bestätige ich Ihnen hiermit die Reservierung für das Apartment ' + flatName + '.' + NL +
        'Der Gesamtpreis setzt sich wie folgt zusammen:' + NL +
        NL + 

        '<span style="color: #9B70FE; font-weight: bold;">Apartment ' + flatName + '</span>' + NL + 
        flatDetailsText +
        from + ' – ' + to + '  |  ' + nights + ' Nächte  |  ' + guests + ' Personen' + NL +
        'Erwachsene: ' + guests_adult + NL +
        'Kinder (bis 17): ' + guests_teens + NL +
        'Kinder (bis 9): ' + guests_children + NL +
        'Kinder (bis 4): ' + guests_children_free + NL +
        NL +

        'Wohnungspreis: ' + priceBasic + NL +
        'weitere Personen: ' + priceExtrPersons + NL +
        'Servicegebühr: ' + priceClean + NL +
        '<strong>GESAMT: ' + priceTotal + '</strong>' + NL +
        NL +

        '(Die Kurtaxe beläuft sich auf insgesamt ca. ' + priceFee + ' und muss bitte ' +
        'bar vor Ort entrichtet werden. Mit der ausgestellten Kurkarte erhalten Sie ' +
        'Rabatte u.a. in der SaarowTherme.)' + NL +
        NL +
        NL +

        'Wir bitten Sie eine Anzahlung in Höhe von ' + pricePart + ' (20% des Gesamtbetrages) innerhalb von 14 Tagen auf folgendes Konto zu überweisen: ' + NL +
        NL +

        'Valentina Wilhelm' + NL +
        'comdirect' + NL +
        'IBAN: DE75200411550893836700' + NL +
        'BIC: COBADEHD055' + NL +
        NL +

        'Bitte überweisen Sie den restlichen Betrag in Höhe von ' + priceRest + ' 14 Tage vor Ihrer Anreise, jedoch spätestens zum ' + priceRestDate + '.' + NL +
        NL +

        'STORNOBEDINGUNGEN ' + NL +
        '100% Erstattung für Stornierung mehr als 14 Tage vor Anreisetag.' + NL +
        '50% Erstattung für Stornierung mehr als 7 Tage vor Anreisetag.' + NL +
        NL +

        'Wir freuen uns darauf, Sie schon bald in unserer Ferienunterkunft <span style="color: #9B70FE">SALZ›T‹RÄUME AM SEE</span> begrüßen zu dürfen.';
    
    var content = '<div class="container"><p>' + template +  '</p></div>';
    $('#reservation').html(content);
}