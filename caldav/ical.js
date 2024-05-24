// iCalendar functionality.
// Handles the processing of calendar resources.

/* class Resource:
   A calendar resource. Can be used to represent a
   VCALENDAR, VJOURNAL, etc.
   Resources can be nested; for e.g, a VJOURNAL resource
   nested in a VCALENDAR resource.

   All properties found in a resource are stored, regardless
   of whether they are interpreted or not.

   A field defined as `FIELD:VALUE` in the iCalendar resource
   are stored as members of the array `Resource.Field ["FIELD"]`.
*/
class Resource {
    // lines: the resource as a plain text string
    // start: the first line of the resource (will be read from `lines` if undefined)
    // Note: this constructor SHOULD NOT be called directly; use Resource.from_string instead
    constructor (lines, start) {
        // Determine the type of resource
        if (start === undefined) start = lines.next ().value;
        var fields = start.split ('BEGIN:');
        if (fields [0] != "")
            throw Error ("Expected `BEGIN:`, got " + line);
        this.Type = fields [1];
        this.Done = false;
        this.Children = [];
        this.Fields = [];

        // Process resource contents, including nested resources
        while (true) {
            var line = lines.next ();
            if (line.done) break;

            var sep = line.value.search (":");
            var field = line.value.slice (0, sep);
            var val = line.value.slice (sep + 1);

            if (field == "END" && val == this.Type) {
                this.Done = true;
                break;
            }

            if (field == "BEGIN") {
                this.Children.push (new this.constructor (lines, line.value));
                continue;
            }

            if (this.Fields [field] === undefined) this.Fields [field] = [];
            this.Fields [field].push (val);
        }

        // Call the handler for this resource type as an instance method
        for (var h in this.constructor.Handlers) {
            if (this.constructor.Handlers [this.Type] != undefined) {
                this._handler = this.constructor.Handlers [this.Type];
                this._handler ();
            }
        }
    }

    // Encode the resource object into the iCalendar format
    encode () {
        var res_str = "BEGIN:" + this.Type + "\n";

        for (var f in this.Fields)
            res_str += f + ":" + this.Fields [f] + "\n";
        for (var c in this.Children)
            res_str += this.Children [c].encode();

        res_str += "END:" + this.Type + "\n";
        return res_str;
    }

    // Set of handlers for resource types.
    // Indices are resource types (e.g. "VCALENDAR", "VJOURNAL") and
    // values are handler functions
    static Handlers = [];
    // Once a resource `res` of type `TYPE` (indicated by "BEGIN:TYPE")
    // is constructed, the handler Handlers [TYPE] is called as an
    // instance method on the resource object.

    // res: the resource as a plain text string
    // This is the preferred technique to create a resource object
    static from_string (res) {
        var lines = res.split ('\n').values ();
        return new Resource (lines);
    }
}
