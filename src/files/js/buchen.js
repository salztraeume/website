var apiKey = 'AIzaSyDGe2JRJfoty5LN_U6ObHMP02MjvKS5aP8'; 
var calendarId = 'jalu3vd0rqj67ojfs5ld8ecrdc@group.calendar.google.com';
var fields = 'description,items(id,created,end,start,status,summary,updated,location),summary';
var base = 'https://www.googleapis.com/calendar/v3/calendars/'
var url = base + calendarId + '/events?fields=' + fields + '&key=' + apiKey;

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