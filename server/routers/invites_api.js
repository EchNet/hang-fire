/* invites_api.js */

// There is no Invite model type, but this router follows the same general pattern as for model-
// related routers.  An invitation is represented by a EmailSessionSeed model with non-null
// fromUserId and messageId fields.

const admittance = require("../biz/admittance");
const EmailSessionSeed = require("../models/index").EmailSessionSeed;
const Message = require("../models/index").Message;
const ApiValidator = require("./api_validator");

var router = require("express").Router();

const VALIDATOR = new ApiValidator({
  assetId: {
    required: true,
    type: "integer"
  },
  email: {
    constant: true,
    required: true,
    type: "string"
  }
});

// Retrieve invite by ID
router.get("/:id", function(req, res) {
  res.jsonResultOf(EmailSessionSeed.findById(req.params.id)
  .then(function(invite) {
    if (!invite) {
      throw { status: 404 };
    }
    // An invite may be viewed only by the sender or an admin.
    if (req.user.id != invite.fromUserId && !(req.user.level <= 0)) {
      throw { status: 401 };
    }
    return invite;
  }));
});

// Create an invite.
router.post("/", function(req, res) {
  var fields = VALIDATOR.validateNew(req.body);
  fields.fromUserId = req.user.id;
  // TODO: validate asset.

  res.jsonResultOf(new admittance.Invitation(req, req.body.email, req.user, req.body.assetId).process());
});

// Update the invite by ID - only the asset may be changed.
router.put("/:id", function(req, res) {
  var fields = VALIDATOR.prevalidateUpdate(req.body);
  res.jsonResultOf(EmailSessionSeed.findById(req.params.id, { deep: true })
  .then(function(invite) {
    if (!invite) {
      throw { status: 404 };
    }
    if (!(req.user.level <= 0) && (!invite.fromUser || req.user.id != invite.fromUser.id)) {
      throw { status: 401 };
    }
    fields = VALIDATOR.postvalidateUpdate(invite.message, fields);
    if (!fields) {
      return invite;
    }
    return invite.message.updateAttributes(fields).then(function() {
      return invite;
    });
  }));
});

// Delete invite by ID
router.delete("/:id", function(req, res) {
  res.jsonResultOf(EmailSessionSeed.findById(req.params.id)
  .then(function(invite) {
    if (!invite) {
      throw { status: 404 };
    }
    if (!(req.user.level <= 0) && req.user.id != invite.fromUserId) {
      throw { status: 401 };
    }
    return EmailSessionSeed.destroyById(req.params.id);
  }));
});

if (process.env.NODE_ENV == "test") {
  // Delete all invites
  router.delete("/", function(req, res) {
    res.jsonResultOf(EmailSessionSeed.destroyAll());
  });
}

module.exports = router;