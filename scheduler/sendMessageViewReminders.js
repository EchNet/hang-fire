const models = require('../server/models/index');
const Moment = require('moment-timezone');
const exec = require('../server/util/exec');
const messageViewReminders = require("../server/biz/message_reminders");
const CONFIG = require("../server/conf");

const VIEW_EXCEPTION = 60; // 60 minutes, change if this needs to be a diffrent no in the future



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

function yetDue(createdAt, now) {
         console.log('createdAt:' + createdAt);
         console.log('now:' + now);
         console.log('difference in minutes:' + now.diff(createdAt, "minutes"));

        return now.diff(createdAt, "minutes") >= VIEW_EXCEPTION;
}

function sameTimeToday(date, now) {
  date = date.clone();
  date.setYear(now.getYear());
  date.setMonth(now.getMonth());
  return date;
}

function sendRightNow(unviewedMessage, rightNow) {

  var createdAt = Moment(unviewedMessage.createdAt).format();

   if (!Moment(unviewedMessage.createdAt).isValid()) {
    console.log("bad delivery date", unviewedMessage.createdAt);
    return false;
  }
  if (!createdAt || !yetDue(createdAt, rightNow)) { 

    return false;
  }

  return true;
}

function remindersToSend(unviewedMessages, rightNow) {
  var result = [];

  unviewedMessages.forEach(function(unviewedMessage) {
  
    if (sendRightNow(unviewedMessage, rightNow)) {
      result.push(unviewedMessage);
    }
  });
  
  return result;
}

function sendReminderEmail(reminder, req) {
  var emailPromise = messageViewReminders.sendReminderEmail(reminder, req);
  if (CONFIG.env == "test") {
    return emailPromise.then(function() {
      return reminder;
    });
  }
  return reminder;
}

function makeReminderSender(reminder, req, messagesSent) {
  return sendReminderEmail(reminder, req)
  .then(function(reminder){
    messagesSent.push(reminder);
    return reminder.update({
      state: 2
    });
  })
}

function mapToReminderSenders(remindersToSend, req, messagesSent) {
 var result = [];
  remindersToSend.forEach(function(reminder) {
    result.push(makeReminderSender(reminder, req, messagesSent));
  });
  return result;
}

function processMessages(req, rightNow) {

  var rightNow = Moment(rightNow);
  return new Promise(function(resolve) {
    var activeReminders = [];
    var messagesSent = [];
    var unviewedMessages = [];

    resolve(models.Message.findUnreadMessages({ deep: true })
    .then(function(messages) {
      unviewedMessages = messages;
      reminderSenders = mapToReminderSenders(remindersToSend(unviewedMessages, rightNow), req, messagesSent)
    })
    .then(function() {
      return {
        remindersSent: reminderSenders,
        messagesSent: messagesSent
      };
    }))
  });
}

function MessageViewReminders(date) {
  this.date = date;
}

MessageViewReminders.prototype = {
  processMessages: processMessages
};

module.exports = MessageViewReminders;
