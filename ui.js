// Main control flow for the CalDAV notes client
// Handles calendar discovery and UI

var containerElement = document.querySelector ("#calendar-container");

// Handlers for calendars and journals
// When a resource is constructed, the handler corresponding to its type
// is called as an instance method on the resource object.
// These handlers define some UI-related setup as well as running some
// extra setup like setting default field values, enforcing rules for values, etc.
// Note: class Resource is defined in file ical.js
Resource.Handlers ["VJOURNAL"] = function () {
    // Values that should default to the empty string
    for (var f of ['DESCRIPTION', 'SUMMARY']) {
        if (this.Fields [f] === undefined)
            this.Fields [f] = "<i>empty</i>";
    }

    this.element = document.createElement ('div');
    this.element.innerHTML = (
        "<h3>" + this.Fields ['SUMMARY'] + "</h3>" +
        "<p>" + this.Fields ['DESCRIPTION'] + "</p>"
    )
    this.element.classList.add ("vjournal");
}
Resource.Handlers ["VCALENDAR"] = function () {
    this.element = document.createElement ('div');
    //this.nameElement = document.createElement ('h1'); // This needs to be populated by the caller,
    //this.element.appendChild (this.nameElement);      // since the display name is not known in this scope.
    for (var c in this.Children) {
        if (this.Children [c].element === undefined) continue;
        this.element.appendChild (this.Children [c].element);
    }
    this.element.classList.add ("vcalendar");
}

// Convenience wrapper around nl.sara.webdav.Client.propfind
// props: array of the form [ {ns: "ns", tag: "tag"}, ... ]
function _propfind (path, props, depth) {
    var properties = props.map ( (p) => new Property (p.ns, p.tag) );
    return new Promise ( (resolve, reject) => {
        connection.propfind (path, (status, body, headers) => {
            body.request_path = path;
            resolve (body);
        }, depth, properties);
    });
}

_propfind (
    '/',
    [{ns: "DAV:", tag: "current-user-principal"}],
    0
).then ( (body) => { // User's principal
    var principal = body.getResponse ('/').getProperty ('DAV:', 'current-user-principal').xmlvalue [0].innerHTML;
    console.log ("Found principal collection: " + principal);
    return _propfind (
        principal,
        [{ns: "urn:ietf:params:xml:ns:caldav", tag: "calendar-home-set"}],
        0
    );
}).then ( (body) => { // Calendar home set
    var calendar_home = body.getResponse (body.request_path).getProperty ('urn:ietf:params:xml:ns:caldav', 'calendar-home-set').xmlvalue [0].innerHTML;
    console.log ("Found calendar home set: " + calendar_home);
    return _propfind (
        calendar_home,
        [{ns: "DAV:", tag: "resourcetype"}, {ns: "DAV:", tag: "displayname"}],
        1
    );
}).then ( (body) => { // Calendars belonging to the user
    var calendars = {};
    for (var r in body._responses) {
        var res = body.getResponse (r);
        var type = res.getProperty ("DAV:", "resourcetype");
        if (! isCalendar (type._xmlvalue)) {
            continue;
        }
        var name = res.getProperty ("DAV:", "displayname");
        calendars [res.href] = name;
    }
    return new Promise ( (resolve) => { resolve (calendars) } );
}).then ( (calendars) => { // Individual resources within this calendar
    for (var cal in calendars) {
        var calElement = document.createElement ('div');
        calElement.classList.add ('calendar-box');
        calElement.innerHTML = "<h1>" + cal + "</h1>";

        getJournals (cal).then ( (jnls) => {
            for (var j in jnls) {
                var jnl = jnls [j];
                var res = Resource.from_string (jnl);
                console.log (res.encode ());
                calElement.appendChild (res.element);
            }
        });
        containerElement.appendChild (calElement);
    }
});
