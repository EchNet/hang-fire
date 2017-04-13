var express = require('express');
var router = express.Router();
var Moment = require('moment-timezone');
const ApiValidator = require("./../api_validator");
const UserMessageEvents = require("../../models/index").UserMessageEvents;
const Message = require("../../models/index").Message;

const VALIDATOR = new ApiValidator({
  messageId : {
    type: "integer"
  },
  clientTime : {
    type: "date"
  },
  type : {
    type: "string"
  }
});

/* GET events related to a speficic user for a specific message. */
router.get("/user/:userId/message/:messageId", function(req, res) {	
  res.jsonResultOf(UserMessageEvents.findReadMessageEventsForUser(req.params.userId, req.params.messageId, { deep: true })
  .then(function(usermesageevents) {
    if (!usermesageevents) {
      throw { status: 404 };
    }
    // A message may be viewed only the admin.
    if (!req.isAdmin) {
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
    // A message may be viewed only the admin.
    if (!req.isAdmin) {
      throw { status: 401 };
    }
    return messages;
  }));
});

//New Event Log, will log events with details provided via json object, will require message id, client time and the even type
router.post("/newEventLog", function(req, res) {
  res.jsonResultOf(new Promise(function(resolve) {
    var fields = VALIDATOR.prevalidateUpdate(req.body);
    resolve(Message.findById(req.body.messageId)
      .then(function(message) {
        if (!message) {
          throw { status: 404 };
        }
        fields = VALIDATOR.postvalidateUpdate(message, fields);
        if (!fields) {
          return message;
        } else {
        fields.userId = (message.toUserId === null) ? req.user.id : message.toUserId ;  
        return UserMessageEvents.create(fields)
     .then(function(userMessageEvent) {
      if(!userMessageEvent) {
        throw {status: 401};
      }
      else {
           fields={state:3};
          return message.updateAttributes(fields);
        }
      })
      };
      })
    );
  }))
});

module.exports = router;
