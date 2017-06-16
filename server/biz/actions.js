/* biz/actions.js */

const extend = require("extend");
const when = require("../util/when");
const Miner = require("./miner");
const Message = require("../models/index").Message;

function forEach(arrayOrHash, callback) {
  for (var i in arrayOrHash) {
    callback(arrayOrHash[i], i);
  }
  return arrayOrHash;
}

function ActionCompiler(user) {
  this.user = user;
  this.actionGroups = [
    { priority: 0, "class": "inbox", actions: [] },
    { priority: 1, "class": "contacts", actions: [] },
    { priority: 2, "class": "other", actions: [] }
  ];
}

function findField(data, fieldName) {
  if (data) {
    for (var i in data) {
      if (fieldName in data[i]) {
        return data[i][fieldName];
      }
    }
  }
}

function createActionItem(id, data) {
  var objectId, date;
  if (data) {
    objectId = findField(data, "id");
    date = data.thread && data.thread[0].updatedAt;
    if (!date) {
      date = findField(data, "updatedAt");
    }
  }
  if (objectId) {
    id += "-" + objectId;
  }
  return extend({
    id: id,
    date: date
  }, data);
}

function createActionItems(compiler) {

  function addActionItem(groupIndex, actionItem) {
    compiler.actionGroups[groupIndex].actions.push(actionItem);
  }

  if (compiler.user.name) {

    if (compiler.announcements.length) {
      addActionItem(0, createActionItem("ann-rec", {
        user: compiler.announcements[0].fromUser,
        thread: compiler.announcements
      }));
    }

    forEach(compiler.incomingInvitations, function(inv) {
      addActionItem(0, createActionItem("inv-rec", { invite: inv }));
    });

    forEach(compiler.others, function(other) {
      if (other.unreadMessage) {
        addActionItem(0, createActionItem("gre-in", {
          user: other.user,
          message: other.unreadMessage
        }));
      }
      addActionItem(1, createActionItem(other.thread.length == 1 && other.thread[0].type != Message.GREETING_TYPE ? "con-new" : "con-out", {
        user: other.user,
        thread: other.thread || []
      }));
    });

    forEach(compiler.outgoingInvitations, function(inv) {
      addActionItem(1, createActionItem("inv-upd", { invite: inv }));
    });

    if (compiler.user.level <= 1) {
      addActionItem(1, createActionItem("inv-cre"));
    }

    addActionItem(2, createActionItem("rem-cre"));

    if (compiler.user.level <= 0) {    // admin
      addActionItem(2, createActionItem("ann-cre"));
    }
  }
  else {
    addActionItem(2, createActionItem("usr-cre"));
  }
}

function postProcessGroups(actionGroups) {
  for (var i = 0; i < actionGroups.length; ) {
    if (!actionGroups[i].actions.length) {
      actionGroups.splice(i, 1);
    }
    else {
      actionGroups[i].actions.sort(function(a, b) {
        var ta = a.date ? a.date.getTime() : 0;
        var tb = a.date ? a.date.getTime() : 0;
        return ta - tb;  // descending
      });
      ++i;
    }
  }
  return actionGroups;
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
        email: compiler.emailProfile && compiler.emailProfile.email,
        asset: compiler.user.asset
      },
      actionGroups: postProcessGroups(compiler.actionGroups)
    }
  })
}

module.exports = ActionCompiler;
