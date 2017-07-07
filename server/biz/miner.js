/* biz/miner.js */

// Get everything relevant about a user at the moment.

const models = require("../models/index");
const exec = require("../util/exec");

const MAX_OF_ANY_ONE_TYPE = 10;

function Miner(user) {
  var self = this;
  self.user = user;
  self.announcements = [];
  self.incomingInvitations = [];
  self.outgoingInvitations = [];
  self.outgoingReminders = [];
  self.others = {};
}

function getEmailProfile(miner) {
  return models.EmailProfile.findByUser(miner.user)
  .then(function(emailProfiles) {
    if (emailProfiles && emailProfiles.length) {
      miner.emailProfile = emailProfiles[0];
    }
  });
}

function openOther(miner, user) {
  if (!(user.id in miner.others)) {
    miner.others[user.id] = {};
  }
  var other = miner.others[user.id];
  other.user = user;
  return other;
}

function getAnnouncements(miner) {
  return ((miner.user.level <= 0)
    ? models.Message.findAnnouncements()
    : models.Message.findCurrentAnnouncementsForUser(miner.user.id)
  )
  .then(function(announcements) {
    return miner.announcements = announcements || [];
  });
}

function makeThreadGetter(userId, other) {
  return function() {
    var lastReceived = null;

    return models.Message.findThread(userId, other.user.id, {
      limit: 5
    })
    .then(function(thread) {
      other.thread = thread;
      for (var i = 0; i < thread.length; ++i) {
        if (thread[i].toUserId == userId) {
          lastReceived = thread[i];
          return models.UserMessageEvent.anyUserMessageView(userId, lastReceived.id);
        }
      }
      return null;
    })
    .then(function(view) {
      if (lastReceived && !view) {
        other.unreadMessage = lastReceived;
      }
      return null;
    });
  };
}

function getConnections(miner) {
  return models.Connection.findByUserId(miner.user.id, { deep: 1 })
  .then(function(connections) {
    if (connections) {
      var threadGetters = [];
      for (var i = 0; i < connections.length; ++i) {
        var connection = connections[i];
        var other = openOther(miner, connection.peer);
        other.isConnection = true;
        threadGetters.push(makeThreadGetter(miner.user.id, other));
      }
      return exec.executeGroup(miner, threadGetters);
    }
    return null;
  });
}

function getOutgoingInvitations(miner) {
  return models.Invite.findByFromUserId(miner.user.id, {
    deep: 1,
    excludeClosed: 1
  })
  .then(function(invites) {
    return miner.outgoingInvitations = invites || [];
  })
}

function getIncomingInvitations(miner) {
  return models.Invite.findByToUserId(miner.user.id, {
    deep: 1,
    excludeClosed: 1
  })
  .then(function(invites) {
    return miner.incomingInvitations = invites || [];
  })
}

function getOutgoingReminders(miner) {
  return models.Reminder.findByFromUserId(miner.user.id, {
    deep: 1,
    excludeClosed: 1
  })
  .then(function(reminders) {
    return miner.outgoingReminders = reminders || [];
  })
}

Miner.prototype.run = function() {
  var miner = this;
  return exec.executeGroup(miner, [
    getEmailProfile,
    getAnnouncements,
    getConnections,
    getOutgoingInvitations,
    getIncomingInvitations,
    getOutgoingReminders
  ])
}

module.exports = Miner;
