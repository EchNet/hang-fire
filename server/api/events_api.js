var express = require('express');
var router = express.Router();
const ApiValidator = require("./api_validator");
const Promise = require("promise");
const UserMessageEvent = require("../models/index").UserMessageEvent;

const VALIDATOR = new ApiValidator({
  messageId: {
    type: "integer",
    required: true      // for now.
  },
  clientTime: {
    type: "date"
  },
  type: {
    type: "string",
    required: true
  }
});

router.post("/", function(req, res) {
  res.jsonResultOf(new Promise(function(resolve) {
    if (!req.user) {
      throw { status: 401 };
    }
    var fields = VALIDATOR.validateNew(req.body);
    resolve(UserMessageEvent.builder()
      .type(fields.type)
      .userId(req.user.id)
      .messageId(fields.messageId)
      .clientTime(fields.clientTime)
      .build());
  }))
});

module.exports = router;
