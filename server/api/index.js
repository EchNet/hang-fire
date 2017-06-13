/* api/index.js */

var router = require("express").Router();

// All API functions require some sort of authentication.

router.use(function(req, res, next) {
  if (!req.isAdmin && !req.user) {
    next({ status: 401 });
  }
  else {
    next();
  }
});

router.use("/connections", require("./connections_api"));
router.use("/emailprofiles", require("./email_profiles_api"));
router.use("/events", require("./events_api"));
router.use("/invites", require("./invites_api"));
router.use("/messages", require("./messages_api"));
router.use("/profile", require("./profile_api"));
router.use("/users", require("./users_api"));
router.use("/tickets", require("./tickets_api"));
router.use("/reminders", require("./reminders_api"));
router.use("/threads", require("./threads_api"));

module.exports = router;
