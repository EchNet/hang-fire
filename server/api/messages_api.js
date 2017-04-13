/* messages_api.js */

const Message = require("../models/index").Message;
const Connection = require("../models/index").Connection;
const ApiValidator = require("./api_validator");
const UserMessageEvents = require("../models/index").UserMessageEvents;
const CONFIG = require("../conf");
var sendMessageViewReminders = require("../../scheduler/sendMessageViewReminders");

const Promise = require("promise");

const DEFAULT_ANNOUNCEMENT_DURATION = 14*24*60*60*1000;   // 14 days

const VALIDATOR = new ApiValidator({
  assetId: {
    required: true,
    type: "integer"
  },
  endDate: {
    type: "date"
  },
  startDate: {
    type: "date"
  },
  toUserId: {
    constant: true,
    type: "integer"
  },
  type: {
    defaultValue: 0,
    maxValue: Message.MAX_TYPE,
    minValue: 0,
    type: "integer"
  },
  state: {
    defaultValue: 0,
    maxValue: Message.MESSAGE_STATE_VIEWED,
    minValue: Message.MESSAGE_STATE_UNCHECKED,
    type: "integer"
  }
});

var router = require("express").Router();

// Retrieve message by ID
router.get("/:id", function(req, res) {
  res.jsonResultOf(Message.findById(req.params.id, { deep: true })
  .then(function(message) {
    if (!message) {
      throw { status: 404 };
    }
    // A message may be viewed only by the sender, the receiver, or an admin.
    if (!req.isAdmin && req.user.id != message.fromUserId && req.user.id != message.toUserId) {
      throw { status: 401 };
    }
    return message;
  }));
});

// Delete message by ID
router.delete("/:id", function(req, res) {
  res.jsonResultOf(Message.findById(req.params.id)
  .then(function(message) {
    if (!message) {
      throw { status: 404 };
    }
    // A message may be deleted only by the sender.
    if (!req.isAdmin && req.user.id != message.fromUserId) {
      throw { status: 401 };
    }
    return Message.destroyById(req.params.id);
  }));
});

if (process.env.NODE_ENV == "test") {
  // Delete all messages
  router.delete("/", function(req, res) {
    res.jsonResultOf(new Promise(function(resolve) {
      resolve(Message.destroyAll());
    }))
  });
}

// Create a message.
router.post("/", function(req, res) {
  res.jsonResultOf(new Promise(function(resolve) {
    if (!req.user) {
      throw { status: 401 };
    }

    var fields = VALIDATOR.validateNew(req.body);
    fields.fromUserId = req.user.id;
    
    // TODO: validate asset.

    // Validate toUserId.
    var toUserId = fields.toUserId;
    var personal = false;
    switch (fields.type) {
    case Message.GREETING_TYPE:
    case Message.INVITE_TYPE:
      personal = true;
    }
    if ((toUserId == null) == personal) {
      throw { body: { toUserId: toUserId || "?" }};
    }

    // TODO: validate toUser.

    switch (fields.type) {
    case Message.ANNOUNCEMENT_TO_ALL_TYPE:
    case Message.ANNOUNCEMENT_TO_NEW_TYPE:
      if (!req.isAdmin) {
        throw { status: 401 };
      }
      if (!fields.startDate) {
        fields.startDate = new Date();
      }
      if (!fields.endDate) {
        fields.endDate = new Date(fields.startDate.getTime() + 30*24*60*60*1000);
      }
    }

    resolve(Message.create(fields));
  }))
});

// Update message by ID.
router.put("/:id", function(req, res) {
  res.jsonResultOf(new Promise(function(resolve) {
    var fields = VALIDATOR.prevalidateUpdate(req.body);
    console.log(fields);
    resolve(Message.findById(req.params.id)
      .then(function(message) {
        if (!message) {
          throw { status: 404 };
        }

        fields = VALIDATOR.postvalidateUpdate(message, fields);
        if (!fields) {
          return message;
        }

        switch (fields.type) {
        case Message.ANNOUNCEMENT_TO_ALL_TYPE:
        case Message.ANNOUNCEMENT_TO_NEW_TYPE:
          if (!req.isAdmin) {
            throw { status: 401 };
          }
          break;
        default:
          if ("type" in fields) {
            throw { body: { type: fields.type } };
          }
        }

        return message.updateAttributes(fields);
      })
    );
  }))
});

if (CONFIG.env == "test") {
 router.post("/sendreminders/:currTime", function(req, res, next) {
 var currDate = new Date(req.params.currTime);
 console.log('Input Date:' + currDate);
 const processUnreadMessages = new sendMessageViewReminders() ;
 processUnreadMessages.processMessages(req, currDate).then(function(result) {

     if (result.remindersSent.length >0)
         { 
             jsonSuccessString = {'result':'success, emails sent'} 
             res.status(200).send(jsonSuccessString);
         }  else {
             jsonSuccessString = {'result':'no email reminders required'} 
             res.status(401).send(jsonSuccessString);     
         }
         
    
    })
  })
}

if (CONFIG.env == "test") {
router.put("/updateCreatedAt/:id", function(req, res) {
  res.jsonResultOf(new Promise(function(resolve) {
    var fields = req.body;
    console.log(fields);
    resolve(Message.findById(req.params.id)
      .then(function(message) {
        if (!message) {
          throw { status: 404 };
        }
        return message.updateAttributes(fields);
      })
    );
  }))
});
}

module.exports = router;
