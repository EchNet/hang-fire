/* biz/actions.js */

const extend = require("extend");
const when = require("../util/when");
const Miner = require("./miner");
const Message = require("../models/index").Message;

const TOPIC_INVITATION = "inv";    // Ask another user to connect.
const TOPIC_CONNECTION = "con";    // Stay in touch with another user.
const TOPIC_REMINDER = "rem";      // A message sent at a specific time, possibly repeating.
const TOPIC_USER = "usr";          // Name and other details.
const TOPIC_PROFILE = "pro";       // About me...
const TOPIC_ANNOUNCEMENT = "ann";  // A broadcast message, usually by the administrator.

const ACTION_CREATE = "cre";       // Create a message and a wrapper for it.
const ACTION_UPDATE = "upd";       // Replace the message in a wrapper with a new one.
const ACTION_RECEIVE = "rec";      // Interact with an incoming message.

const PROPERTIES = {
  "con": {
    "in": { priority: 94 },
    "out": { priority: 35 },
    "new": { priority: 70 }
  },
  "rem": { 
    "rec": { priority: 95, },
    "cre": { priority: 66 },
    "upd": { priority: 1 }
  },
  "inv": { 
    "rec": { priority: 93, },
    "cre": { priority: 62 },
    "upd": { priority: 31 }
  },
  "ann": {
    "rec": { priority: 92, },
    "cre": { priority: 60 },
    "upd": { priority: 30 }
  },
  "pro": { 
    "cre": { priority: 40 },
    "upd": { priority: 20 }
  },
  "usr": {
    "cre": { priority: 50 },
    "upd": { priority: 10 }
  }
}

const MAX_ACTION_ITEMS = 20;

function byPriorityDesc(a, b) {
  return b.priority - a.priority;
}

function priorityOfSubjectAction(topic, action) {
  try {
    return PROPERTIES[topic][action].priority;
  }
  catch (e) {
    return 50;
  }
}

function ActionCompiler(user) {
  this.user = user;
  this.actionItems = [];
}

function findObjectId(data) {
  if (data) {
    for (var i in data) {
      if ("id" in data[i]) {
        return data[i].id;
      }
    }
  }
}

function addActionItem(compiler, topic, action, data) {
  var id = topic + "-" + action;
  var objectId = findObjectId(data);
  if (objectId) {
    id += "-" + objectId;
  }
  compiler.actionItems.push(extend({
    id: id,
    priority: priorityOfSubjectAction(topic, action)
  }, data));
}

function addConnectionItems(compiler) {
  var others = compiler.others;
  for (var otherUserId in others) {
    var other = others[otherUserId];
    var thread = other.thread;
    var aspect = "new";
    var data = {
      user: other.user,
      thread: thread || []
    };
    if (thread && thread.length) {
      if (thread[0].fromUserId == otherUserId) {
        aspect = thread[0].type == Message.GREETING_TYPE ? "in" : "new";
      }
      else {
        aspect = "out";
      }
    }
    addActionItem(compiler, TOPIC_CONNECTION, aspect, data);
  }
}

function addInvitationItems(compiler) {
  if (compiler.user.level <= 1 && compiler.user.name) {
    addActionItem(compiler, TOPIC_INVITATION, ACTION_CREATE);
  }
  var incomingInvitations = compiler.incomingInvitations;
  for (var i = 0; i < incomingInvitations.length; ++i) {
    var inv = incomingInvitations[i];
    addActionItem(compiler, TOPIC_INVITATION, ACTION_RECEIVE, { invite: inv });
  }
  var outgoingInvitations = compiler.outgoingInvitations;
  for (var i = 0; i < outgoingInvitations.length; ++i) {
    var inv = outgoingInvitations[i];
    addActionItem(compiler, TOPIC_INVITATION, ACTION_UPDATE, {
      invite: inv
    });
  }
}

function addProfileItems(compiler) {
  addActionItem(compiler, TOPIC_PROFILE, compiler.user.asset ? ACTION_UPDATE : ACTION_CREATE, {
    user: compiler.user
  });
  addActionItem(compiler, TOPIC_USER, compiler.user.name ? ACTION_UPDATE : ACTION_CREATE);
}

function addAnnouncementItems(compiler) {
  var isAdmin = compiler.user.level <= 0;
  if (isAdmin) {
    addActionItem(compiler, TOPIC_ANNOUNCEMENT, ACTION_CREATE);
  }
  var announcements = compiler.announcements;
  if (announcements.length) {
    addActionItem(compiler, TOPIC_ANNOUNCEMENT, ACTION_RECEIVE, {
      user: announcements[0].fromUser,
      thread: announcements
    });
  }
}

function addReminderItems(compiler) {
  addActionItem(compiler, TOPIC_REMINDER, ACTION_CREATE);
}

function createActionItems(compiler) {
  addProfileItems(compiler);
  if (compiler.user.name) {
    addConnectionItems(compiler);
    addInvitationItems(compiler);
    addAnnouncementItems(compiler);
    addReminderItems(compiler);
  }
}

function finalizeActionItems(compiler) {
  var actionItems = compiler.actionItems;
  actionItems.sort(function(a, b) {
    return b.priority - a.priority;
  });
  return actionItems.slice(0, MAX_ACTION_ITEMS);
}

ActionCompiler.prototype.run = function() {
  var compiler = this;
  if (!compiler.user) {
    return {};
  }
  return new Miner(compiler.user).run()
  .then(function(miner) {
    extend(compiler, miner);
    return createActionItems(compiler);
  })
  .then(function() {
    return {
      user: {
        id: compiler.user.id,
        name: compiler.user.name,
        email: compiler.emailProfile && compiler.emailProfile.email
      },
      actionItems: finalizeActionItems(compiler)
    }
  })
}

module.exports = ActionCompiler;
