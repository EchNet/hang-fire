const models = require('../server/models/index');
const Moment = require('moment-timezone');
const exec = require('../server/util/exec');

const A_FEW_MINUTES = 10;
const TOO_LATE = 100;
const ONE_DAY = 24*60 - A_FEW_MINUTES;

function unaliasTimeZone(tz) {
  switch (tz) {
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
  return tz;
}

function minutesDiff(m1, m2) {
  return m1.diff(m2, "minutes");
}

function Reminder(model) {
  this.tz = unaliasTimeZone(model.timeZone);
  this.deliverAt = model.deliverAt && Moment(model.deliverAt).tz(this.tz);
  this.lastDeliveredAt = model.lastDeliveredAt && Moment(model.lastDeliveredAt);
  this.repeat = model.repeat;
  this.model = model;
}

Reminder.prototype = {

  validate: function() {
    if (!this.deliverAt || !this.deliverAt.isValid()) {
      return false;
    }
    if (this.lastDeliveredAt && !this.lastDeliveredAt.isValid()) {
      return false;
    }
    return true;
  },

  nextDeliveryTime: function(rightNow) {
    var reminder = this;

    // Get the first delivery time. It's already in the correct time zone.
    var deliverAt = reminder.deliverAt;
    if (deliverAt) {

      // If it's in the future, or at least not too far in the past, that's the one.
      if (minutesDiff(deliverAt, rightNow) > -TOO_LATE) { 
        return deliverAt;
      }

      if (reminder.repeat == 1) {  // Repeat daily.
        var sameTimeToday = Moment(rightNow)
          .hour(deliverAt.hour())
          .minute(deliverAt.minute());
        var diff = minutesDiff(sameTimeToday, rightNow);
        if (diff > -TOO_LATE) {
          return sameTimeToday;
        }
        // Otherwise, same time tomorrow.
        // TODO: this isn't quite right in the case that a TZ offset transition falls into this period.
        return Moment(sameTimeToday).add(24, "hours");
      }
    }
    // TODO: if we miss a delivery, log and apologize.

    return null;
  },

  isDue: function(rightNow) {
    var reminder = this;

    // Ignore reminder that has already been delivered.
    if (!reminder.lastDeliveredAt ||
        (reminder.repeat && minutesDiff(rightNow, reminder.lastDeliveredAt) > TOO_LATE)) {

      // Deliver reminder if its time is due.
      var deliverAt = reminder.nextDeliveryTime(rightNow);
      if (deliverAt) {
        var diffMinutes = minutesDiff(deliverAt, rightNow);
        return diffMinutes <= A_FEW_MINUTES;
      }
    }

    return false;
  },

  messageData: function() {
    var reminder = this;
    return {
      type: models.Message.REMINDER_TYPE,
      fromUserId: reminder.model.fromUserId,
      toUserId: reminder.model.toUserId,
      assetId: reminder.model.assetId
    }
  },

  updateModel: function(message) {
    var reminder = this;
    return reminder.model.update({
      expired: reminder.model.repeat ? 0 : 1,
      lastDeliveredAt: message.createdAt
    });
  },

  makeSender: function(refreshReminders) {
    var reminder = this;
    return function() {
      return models.Message.create(reminder.messageData())
      .then(function(message) {
        refreshReminders.messagesSent.push(message);
        return reminder.updateModel(message);
      });
    }
  }
};

function RefreshReminders(date) {
  this.date = date;
  this.activeReminders = [];
  this.messagesSent = [];
}

function RefreshReminders_sendMessagesDue(self) {
  var rightNow = Moment(self.date);
  var reminders = self.activeReminders;
  var reminderSenders = [];
  reminders.forEach(function(reminder) {
    if (reminder.validate() && reminder.isDue(rightNow)) {
      reminderSenders.push(reminder.makeSender(self));
    }
  });
  return exec.executeGroup(self, reminderSenders);
}

RefreshReminders.prototype = {
  processReminders: function() {
    var self = this;
    return models.Reminder.findAll({
      where: { expired: 0 }
    })
    .then(function(models) {
      self.activeReminders = models.map(function(ele) {
        return new Reminder(ele);
      });
      return RefreshReminders_sendMessagesDue(self);
    })
    .then(function() {
      return self;
    });
  }
};

module.exports = RefreshReminders;
