/* util/When.js - time format utilities */

define([], function() {

  'use strict';

  var DAYS_OF_THE_WEEK = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]

  var MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ]

  var DATE_FORMATS = {
    DAYS_AGO:  "{4} at {6}:{7}{8}",
    LONG_AGO:  "{0}/{1}/{3} at {6}:{7}{8}",
    THIS_YEAR: "{0} {2}, at {6}:{7}{8}",
    TODAY:     "at {6}:{7}{8}",
    YESTERDAY: "yesterday at {6}:{7}{8}",
    DEFAULT:   "{0} {2} {3}"
  }

  var MILLS_PER_DAY = 1000 * 60 * 60 * 24;

  // Coerce the given value to a Date.  If the value is null, return the current Date.
  // Handles Dates, numbers, and strings.
  function toDate(date) {
    if (date === null || date === undefined) {
      return new Date();
    }
    switch (typeof date) {
    case "number":
      return new Date(date);
    case "string":
      return Date.parse(date);
    }
    return date;
  }

  // Check to see if the given date's time portion is at 00:00 UTC.
  // If so, convert it to an exact date in the local time zone for conversion purposes.
  function fixupDate(date) {
    date = toDate(date);
    var dateNum = date.getTime();
    if ((dateNum % MILLS_PER_DAY) === 0 || (typeof(dateNum) === 'string' && dateNum.length <= 10)) {
      date = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }
    return date;
  }

  function expand(format, params) {
    format = DATE_FORMATS[format || "DEFAULT"];
    return format.replace(/{([0-9])}/g, function(match, p1) {
      return params[parseInt(p1)];
    });
  }

  // Format a Date.
  function doFormatDate(date, format) {

    // Compute all properties, whether or not the format string refers to them.
    var y = date.getYear();
    if (y < 1900) {
      y += 1900;    // in IE8, 1900 is already added in.
    }
    var mo = date.getMonth() + 1;
    var month = MONTHS[date.getMonth()];
    var d = date.getDate();  // day of the month
    var day = DAYS_OF_THE_WEEK[date.getDay()];
    var hh = date.getHours();
    var h = date.getHours() % 12;
    if (h === 0) h = 12;
    var m = date.getMinutes();
    if (m < 10) {
      m = "0" + m;
    }
    var ampm = hh >= 12 ? "pm" : "am";

    return expand(format, [ d, mo, month, y, day, hh, h, m, ampm ]);
  }

  function doFormatFutureTime(date, now) {
    var interval = Math.floor((date.getTime() - now.getTime()) / 1000);
    var unit;
    if (interval < 60) {
      unit = "second";
    }
    else if ((interval /= 60) < 60) {
      unit = "minute";
    }
    else if ((interval /= 60) < 24) {
      unit = "hour";
    }
    else if ((interval /= 24) < 30) {
      unit = "day";
    }
    else {
      return doFormatDate(date);
    }
    interval = Math.floor(interval);

    return interval + " " + unit + (interval == 1 ? "" : "s") + " from now";
  }

  function doFormatPastTime(date, now) {
    var format;
    // Choose between showing a date and a day.  We want to show "today" and
    // "yesterday" as such always. For days less recent but still within the past 6 days,
    // showing "last Monday" (for example) is better than showing a date, but the choice
    // is not super-important. Note that not all days have 24 hours!
    if (now.getTime() - date.getTime() < 6*MILLS_PER_DAY) {
      switch (now.getDay() - date.getDay()) {
      case 0:
        // Same day.
        format = "TODAY";
        break;
      case 1: case -6:
        format = "YESTERDAY";
        break;
      default:
        format = "DAYS_AGO";
      }
    }
    else if (date.getYear() == now.getYear()) {
      format = "THIS_YEAR";
    }
    else {
      format = "LONG_AGO";
    }
    return doFormatDate(date, format);
  }

  // Format just the date portion of a date, for general use.
  function formatDate(date) {
    return doFormatDate(fixupDate(date));
  }

  // Format a date/time relative to the current time.
  function formatRelativeTime(date, now) {
    date = toDate(date);
    now = toDate(now);
    return (date.getTime() > now.getTime() ? doFormatFutureTime : doFormatPastTime)(date, now);
  }

  // Formats the time to minutes:seconds
  function formatTime (t) {
    if (t < 0) {
      return "";
    } else {
      var minutes = Math.floor(t / 60);
      var seconds = Math.floor(t % 60);
      if (seconds === 0) {
        seconds = "00";
      } else if (seconds < 10) {
        seconds = "0" + seconds;
      }

      return minutes + ":" + seconds;
    }
  };

  return {
    formatRelativeTime: formatRelativeTime,
    formatTime: formatTime
  }
});
