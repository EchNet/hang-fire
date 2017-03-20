const models = require('../server/models/index');
const Moment = require('moment-timezone');
const exec = require('../server/util/exec');

const A_FEW_MINUTES = 10;
const TOO_LATE = 100;
const ONE_DAY = 24*60 - A_FEW_MINUTES;

function applyTimeZone(moment, timeZone) {

  var tz;
  switch (timeZone) {
  case "Eastern":
    tz = "America/New_York";
    break;
  case "Central":
    tz = "America/Chicago";
    break;
  case "Mountain":
    tz = "America/Denver";
    break;
  case "Pacific":
    tz = "America/Los_Angeles";
    break;
  case "IST":
    tz = "Asia/Kolkata";
  }

  if (tz) {
    moment.tz(tz);
  }
  return moment;
}

// TODO: if it's too late, log and apologize.
function yetDue(targetTime, now) {
  var diffMinutes = targetTime.diff(now, "minutes");
  return diffMinutes <= A_FEW_MINUTES && diffMinutes >= -TOO_LATE;
}

function sameTimeToday(date, now) {
  date = date.clone();
  date.setYear(now.getYear());
  date.setMonth(now.getMonth());
  return date;
}

function sendRightNow(reminder, rightNow) {
  var deliverAt = Moment(reminder.deliverAt);
  if (!deliverAt.isValid()) {
    console.error("bad delivery date", reminder.deliverAt);
    return false;
  }

  var timeZone = reminder.timeZone;
  var lastDeliveredAt = reminder.lastDeliveredAt;

  // Ignore reminder that triggered within the last day.
  if (lastDeliveredAt) {
    lastDeliveredAt = Date.parse(lastDeliveredAt);
    if (rightNow.diff(lastDeliveredAt, "minutes") < ONE_DAY) {
      return false;
    }
  }

  // Is this reminder active yet?
  deliverAt = applyTimeZone(Moment(deliverAt), timeZone);
  if (!deliverAt || !yetDue(deliverAt, rightNow)) { 
    return false;
  }

  if (reminder.repeat) {
    // Put the time into the local time zone.
    rightNow = applyTimeZone(rightNow, timeZone);
    deliverAt = sameTimeToday(deliverAt, rightNow);
    if (!yetDue(deliverAt, rightNow)) {
      return false;
    }
  }
  else {
    // If the reminder does not repeat, send it only once.
    if (lastDeliveredAt) {
      return false;
    }
  }

  return true;
}

function remindersToSend(reminders, rightNow) {
  var result = [];
  reminders.forEach(function(reminder) {
    if (sendRightNow(reminder, rightNow)) {
      result.push(reminder);
    }
  });
  return result;
}

function makeReminderSender(reminder, messagesSent) {
  return function() {
    return models.Message.create({
      type: models.Message.REMINDER_TYPE,
      fromUserId: reminder.fromUserId,
      toUserId: reminder.toUserId,
      assetId: reminder.assetId
    })
    .then(function(message) {
      messagesSent.push(message);
      return reminder.update({
        expired: reminder.repeat ? 0 : 1,
        lastDeliveredAt: new Date()
      });
    });
  }
}

function mapToReminderSenders(remindersToSend, messagesSent) {
  var result = [];
  remindersToSend.forEach(function(reminder) {
    result.push(makeReminderSender(reminder, messagesSent));
  });
  return result;
}

function processReminders() {
  var rightNow = Moment(this.date);

  return new Promise(function(resolve) {
    var activeReminders = [];
    var messagesSent = [];

    resolve(models.Reminder.findAll({
      where: { expired: 0 }
    })
    .then(function(reminders) {
      activeReminders = reminders;
      reminderSenders = mapToReminderSenders(remindersToSend(reminders, rightNow), messagesSent);
      return exec.executeGroup(this, reminderSenders);
    })
    .then(function() {
      return {
        activeReminders: activeReminders,
        messagesSent: messagesSent
      };
    }))
  });
}

function RefreshReminders(date) {
  this.date = date;
}

RefreshReminders.prototype = {
  processReminders: processReminders
};

module.exports = RefreshReminders;
