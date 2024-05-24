This project is a simple CalDAV client with a focus on note-taking
capabilities. Currently, the plan is to have a usable note-taking
interface that is fully compliant with CalDAV and runs in the
browser (although care has been taken to write portable JS code where
possible).

This is a work in progress! If this is interesting to you, keep an
eye here and hopefully you will see a usable client soon!

Currently, the functionality is in three files:
* caldav/caldav.js: CalDAV functionality -- calendar discovery and
  resource retrieval.
* caldav/ical.js: iCalendar functionality -- parsing and processing
  iCalendar resources.
* ui.js: anything to do with the UI, which is HTML

caldav.js and ical.js have been written so that the code is re-usable
on other platforms. That means nothing related to HTML DOM. Ideally,
one should be able to drop in those files into a project on any other
JavaScript platform, and so have to implement only the UI.
