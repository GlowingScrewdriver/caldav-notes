// CalDAV functionality.
// Handles the processing of resources obtained using
// `nl.sara.webdav` WebDAV API.

// The connection to the WebDAV server.
// All HTTP methods on the server happen through this object.
let connection = new nl.sara.webdav.Client ();

// Wrapper to allow setting tagname and namespace during the
// construction of a Property object.
class Property extends nl.sara.webdav.Property {
    constructor (ns, tag) {
        super ();
        this.namespace = ns;
        this.tagname = tag;
    }
}

// Determine whether a given resource is a calendar or not.
// `nodelist` is a NodeList containing resourcetype elements.
function isCalendar (nodelist) {
    for (var n = 0; n < nodelist.length; n++) {
        if (nodelist [n].namespaceURI === "urn:ietf:params:xml:ns:caldav")
            if (nodelist [n].localName === "calendar")
                return true;
    }
    return false;
}

// Retrieve all `VJOURNAL` resources from a calendar collection.
// `calendar` should be the href of a calendar collection.
function getJournals (calendar) {
    req = new Document ();
    var C_NS = "urn:ietf:params:xml:ns:caldav";
    var D_NS = "DAV:";

    query = req.createElementNS (C_NS, "calendar-query");
    req.appendChild (query);

    // Request `calendar-data` for each calendar
    props = req.createElementNS (D_NS, "prop");
    props.appendChild (req.createElementNS (C_NS, "calendar-data"));
    query.appendChild (props);

    // Request calendar resources of type "VJOURNAL"
    filter = req.createElementNS (C_NS, "filter");
    vcalendar_comp_filter = req.createElementNS (C_NS, "comp-filter");
    vcalendar_comp_filter.setAttribute ("name", "VCALENDAR");
    filter.appendChild (vcalendar_comp_filter);
    vjournal_comp_filter = req.createElementNS (C_NS, "comp-filter");
    vjournal_comp_filter.setAttribute ("name", "VJOURNAL");
    vcalendar_comp_filter.appendChild (vjournal_comp_filter);
    query.appendChild (filter);

    return new Promise ( (resolve, reject) => {
        connection.report (calendar, (status, body, headers) => {
            var journals = [];
            for (var r in body._responses) {
                prop = body.getResponse (r).getProperty (C_NS, "calendar-data");
                journals.push (prop._xmlvalue [0].data);
            }
            resolve (journals);
        }, req, 1);
    });
}
