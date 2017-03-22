var express = require('express');
var router = express.Router();
var models = require('../models/index');
var Moment = require('moment-timezone');
var refreshReminders = require('../../scheduler/refreshReminders');

/* GET users listing. */
router.post('/', function(req, res, next) {

 var processReminderHandle = new refreshReminders() ;

 processReminderHandle.processReminders().then(function(result) {
  var jasonSuccessString;
     if (result=='Batch Run Successfully')
         { 
             jsonSuccessString = {'result':'success'} 
             res.status(200).send(jsonSuccessString);
         }  else {
             jsonSuccessString = {'result':'Batch Failed'} 
             res.status(500).send(jsonSuccessString);     
         }
         
    
})

});

module.exports = router;
