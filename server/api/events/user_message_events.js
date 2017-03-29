var express = require('express');
var router = express.Router();
var Moment = require('moment-timezone');
const ApiValidator = require("./../api_validator");
const UserMessageEvents = require("../../models/index").UserMessageEvents;
const Message = require("../../models/index").Message;

const VALIDATOR = new ApiValidator({
  state: {
    defaultValue: 0,
    maxValue: Message.MESSAGE_STATE_VIEWED,
    minValue: Message.MESSAGE_STATE_UNCHECKED,
    type: "integer"
  }
});

/* GET events related to a speficic user for a specific message. */
router.get("/user/:userId/message/:messageId", function(req, res) {	
  res.jsonResultOf(UserMessageEvents.findReadMessageEventsForUser(req.params.userId, req.params.messageId, { deep: true })
  .then(function(usermesageevents) {
    if (!usermesageevents) {
      throw { status: 404 };
    }
    // A message may be viewed only by the sender, the receiver, or an admin.
    if (!req.isAdmin && req.user.id != usermesageevents.fromUserId && req.user.id != usermesageevents.toUserId) {
      throw { status: 401 };
    }
    return usermesageevents;
  }));
});

/* GET events related to a speficic user for a specific message. */
router.get("/allunread", function(req, res) { 
  res.jsonResultOf(Message.findUnreadMessages({ deep: true })
  .then(function(messages) {
    if (!messages) {
      throw { status: 404 };
    }
    // A message may be viewed only by the sender, the receiver, or an admin.
    if (!req.isAdmin && req.user.id != messages.fromUserId && req.user.id != messages.toUserId) {
      throw { status: 401 };
    }
    return messages;
  }));
});

//Create Message Viewed Event
router.post("/newMessageViewedEvent/:id", function(req, res) {
  res.jsonResultOf(new Promise(function(resolve) {
    var fields = VALIDATOR.prevalidateUpdate(req.body);
    resolve(Message.findById(req.params.id)
      .then(function(message) {
        if (!message) {
          throw { status: 404 };
        }
        fields = VALIDATOR.postvalidateUpdate(message, fields);
        if (!fields) {
          return message;
        } else {
        var userId = (message.toUserId === null) ? req.user.id : message.toUserId ;  
        return UserMessageEvents.create({
        type: 'open',
        clientTime: Date.now(),
        userId: userId,
        messageId : message.id
     })
     .then(function(userMessageEvent) {
      if(!userMessageEvent) {
        throw {status: 401};
      }
      else {
          return message.updateAttributes(fields);
        }
      })
      };
      })
    );
  }))
});

module.exports = router;
