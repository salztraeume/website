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

//  +++ booking +++

var calcNights = function() {
    var from = $('#b_arrival').val() || '-';
    var to = $('#b_departure').val() || '-';
    var fromDate = moment(from, DE_FORMATTER);
    var toDate = moment(to, DE_FORMATTER);
    var nights = moment(toDate).diff(fromDate, 'days');
    return nights;
};

var calcTotalGuests = function() {
    var inputs = $('#guests_control input');
    var a = parseInt(inputs[0].value || 0);
    var b = parseInt(inputs[1].value || 0);
    var c = parseInt(inputs[2].value || 0);
    var d = parseInt(inputs[3].value || 0);
    var totalGuests = a+b+c+d;
    
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
    var select = $('#b_flat');
    var base = parseInt(select.find("[value="+select.val()+"]").attr('data-price'));
    var nights = calcNights();

    var extraTreshold = 0;

    // sepcial logic for fuchs rooms
    if (select.val() === 'Fuchs') {
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
    
    var extraSum = 0;
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
                extraSum += tmp.size * tmp.price;
            }
        }
        
        // special offer 8 persons for fuchs = 120 €
        if (totalGuests > 7 && extraSum > (120 - base)) {
            extraSum -= map.adult.price;
            extraText.push('Aktions Rabatt');
        }

        $('#price-extra').text(nights + ' Nächte * (' + extraText.join(' + ')+')');
    } else {
        $('#price-extra').text('–');
    }

    // clean
    var extraClean = 0;
    if (totalGuests > 4) {
        extraClean = (totalGuests - 4) * 5;
    }
    var totalClean = CLEAN_BASE + extraClean;
    $('#price-clean').text(totalClean + ' €');

    // total price
    $('#price-sum').text((base*nights + extraSum*nights + totalClean) + ' €');

    // fee
    $('#price-fee').text(fee*nights + ' €');
};

var resetCalculation = function() {
    $('#price-base').text('');
    $('#price-extra').text('');
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
        }
        calculatePrice();
    });

    $('#flat_fuchs_detail input').on('change', function(e) {
        var values = getDetailsForFuchs();
        var result = values[0] + values[1] + values[2];

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

            var flat = $('#b_flat').val() || '-';
            var from = $('#b_arrival').val() || '-';
            var to = $('#b_departure').val() || '-';
            var nights = calcNights();
            var guests = $('#b_guests_total').val() || '-';
            var guests_adult = $('#b_guests_adult').val() || '-';
            var guests_teens = $('#b_guests_teens').val() || null;
            var guests_children = $('#b_guests_children').val() || null;
            var guests_children_free = $('#b_guests_children_free').val() || null;
            var name = $('#b_name').val() || '-';
            var email = $('#b_email').val() || '-';
            var phone = $('#b_phone').val() || null;
            var note = $('#b_note').val() || null;

            var NL = "%0D%0A";
            var subject = "Buchung: "+from+" — "+to+" / "+nights+" Übernachtungen in " + flat + " / "+guests+" Personen";
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
                "Wohnung: " + flat + NL + flatDetailsText +
                "Erwachsene: "+guests_adult + NL;

            if (guests_teens) body += "Kinder (bis 17): "+guests_teens + NL;
            if (guests_children) body += "Kinder (bis 9): "+guests_children + NL;
            if (guests_children_free) body += "Kinder (bis 4): "+guests_children_free + NL;
            
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