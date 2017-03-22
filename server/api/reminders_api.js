/* reminders_api.js */

const CONFIG = require("../conf");
const Reminder = require("../models/index").Reminder;
const ApiValidator = require("./api_validator");
const Promise = require("promise");
const RefreshReminders = require('../../scheduler/refreshReminders');

const VALIDATOR = new ApiValidator({
  deliverAt: {
    required: true,
    type: "string"
  },
  toUserId: {
    required: true,
    type: "integer"
  },
  assetId: {
    required: true,
    type: "integer"
  },
  repeat: {
    type: "integer",
    defaultValue: 0
  },
  timeZone: {
    type: "string",
    defaultValue: 'Eastern'
  }
});

var router = require("express").Router();

// Create a reminder.
router.post("/", function(req, res) {
  res.jsonResultOf(new Promise(function(resolve) {
    if (!req.user) {
      throw { status: 401 };
    }
    var fields = VALIDATOR.validateNew(req.body);
    fields.fromUserId = req.user.id;
    resolve(Reminder.create(fields));
  }))
});

// Retrieve Reminder by ID
router.get("/:id", function(req, res) {
  res.jsonResultOf(Reminder.findById(req.params.id, { deep: true })
  .then(function(reminder) {
    if (!reminder) {
      throw { status: 404 };
    }
    // A reminder may be viewed only by the sender or an admin.
    if (!req.isAdmin && req.user.id != reminder.fromUserId) {
      throw { status: 401 };
    }
    return reminder;
  }));
});

// Delete Reminder by ID
router.delete("/:id", function(req, res) {
  res.jsonResultOf(Reminder.findById(req.params.id)
  .then(function(reminder) {
    if (!reminder) {
      throw { status: 404 };
    }
    // A reminder may be deleted only by the sender.
    if (!req.isAdmin && req.user.id != reminder.fromUserId) {
      throw { status: 401 };
    }
    return Reminder.destroyById(req.params.id);
  }));
});

// Delete all reminders
if (CONFIG.env == "test") {
  router.delete("/", function(req, res) {
    res.jsonResultOf(Reminder.destroyAll());
  });
}

// Update reminder by ID.
router.put("/:id", function(req, res) {
  res.jsonResultOf(new Promise(function(resolve) {
    var fields = VALIDATOR.prevalidateUpdate(req.body);
    resolve(Reminder.findById(req.params.id)
    .then(function(reminder) {
      if (!reminder) {
        throw { status: 404 };
      }

      fields = VALIDATOR.postvalidateUpdate(reminder, fields);
      if (!fields) {
        return reminder;
      }

      var deliverAt = resloveDeliverDate(fields.deliverAt, fields.timeZone);

      return reminder.updateAttributes({
        assetId: fields.assetId,
        deliverAt: deliverAt ,
        timeZone : fields.timeZone
      });
    }));
  }))
});

if (CONFIG.env == "test") {
  router.post("/refresh", function(req, res, next) {
    res.jsonResultOf(new Promise(function(resolve) {
      var date = req.query.date;
      var processReminderHandle = new RefreshReminders(date);
      resolve(processReminderHandle.processReminders());
    }));
  })
}

module.exports = router;
