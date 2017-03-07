var express = require('express');
var router = express.Router();
var models = require('../models/index');

/* GET users listing. */
router.post('/', function(req, res, next) {
    
models.Message.findCurrentRemindersforUser(req.body.toUserId).then(function(DisplayReminders) {
    res.json(DisplayReminders);
  });    

});

module.exports = router;
