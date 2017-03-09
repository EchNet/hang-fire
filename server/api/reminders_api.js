/* messages_api.js */

const Reminders = require("../models/index").reminders;
const Connection = require("../models/index").Connection;
const ApiValidator = require("./api_validator");
const Promise = require("promise");
var Moment = require('moment-timezone');

const DEFAULT_ANNOUNCEMENT_DURATION = 14*24*60*60*1000;   // 14 days

const VALIDATOR = new ApiValidator({
        dateStr: {
        required: true,
        type: "string"  
        },    
        fromuserid: {
        required: true,
        type: "integer"  
        },
        touserid: {
        required: true,
        type: "integer"
        },                                     
        vid: {
        required: true,
        type: "integer"
        },
        repeat: {
        type: "string",
        defaultValue: 'Yes'                               
        },
        timeZone: {
        type: "string",
        defaultValue: 'Eastern'                               
        }
});

const UPDATE_VALIDATOR = new ApiValidator({                                        
        assetId: {
        required: true,
        type: "integer"
        },
        deliverAt: {
        type: "date",                              
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


    console.log('in the lc scheduler function' + fields.dateStr);
    var vid = fields.vid ;
    
    var inputStr = fields.dateStr;
    var date = new Date(inputStr);
    var rightNow = new Date(Date.now() + 5000);
    var newYorkTime = Moment.tz(date, "America/New_York");
    var losAngeles = newYorkTime.clone().tz("America/Los_Angeles");
    var centralAmerica = newYorkTime.clone().tz("America/Chicago");
    var india = newYorkTime.clone().tz("Asia/Kolkata");

    console.log('this is the date and time now::' + rightNow + "  and this was selected::" + date + "this is the timeZone:" + fields.timeZone );
    console.log('New York :' + newYorkTime.format() + " Los Angeles :" + losAngeles.format() + " Central timeZone" + centralAmerica.format());

    var deliverAt = newYorkTime.format() ; // defaulting to eastern timezone

    if (fields.timeZone == "Eastern") {deliverAt = newYorkTime.format()} ;
    if (fields.timeZone == "Central") {deliverAt = centralAmerica.format()} ;
    if (fields.timeZone == "Pacific") {deliverAt = losAngeles.format()} ;
    if (fields.timeZone == "IST") {deliverAt = india.format()} ;
      
    Reminders.create({
                assetId: fields.vid,
                fromUserId: fields.fromuserid,
                toUserId : fields.touserid,
                status: 1,
                timeZone: fields.timeZone, 
                Repeat : fields.repeat,
                Expired : 'No', 
                deliverAt: deliverAt,
                lastDeliveredAt: 'Never'
            }).then(function (Reminders) {
                if(Reminders) {
                console.log('new reminder created! ');
                 res.status(200).send(Reminders);
                }       
            }).catch(function (err){
                console.log('could not create new Reminder!');
                res.status(500).send('Could not add the reminder, please contact admin ErroCode:' + err.parent.code);   
            });
  }))
});

// Retrieve Reminder by ID
router.get("/:id", function(req, res) {
  console.log('In Get reminder for:' + req.params.id);    
  res.jsonResultOf(Reminders.findById(req.params.id, { deep: true })
  .then(function(reminder) {
    if (!reminder) {
      throw { status: 404 };
    }
    // A message may be viewed only by the sender, the receiver, or an admin.
    if (!req.isAdmin && req.user.id != reminder.fromUserId && req.user.id != reminder.toUserId) {
      throw { status: 401 };
    }
    return reminder;
  }));
});

// Delete Reminder by ID
router.delete("/:id", function(req, res) {
  res.jsonResultOf(Reminders.findById(req.params.id)
  .then(function(reminder) {
    if (!reminder) {
      throw { status: 404 };
    }
    // A message may be deleted only by the sender.
    if (!req.isAdmin && req.user.id != reminder.fromUserId) {
      throw { status: 401 };
    }
    return Reminders.destroyById(req.params.id);
  }));
});

// Update message by ID.
router.put("/:id", function(req, res) {
  res.jsonResultOf(new Promise(function(resolve) {
    var fields = UPDATE_VALIDATOR.prevalidateUpdate(req.body);
    resolve(Reminders.findById(req.params.id)
      .then(function(reminder) {
        if (!reminder) {
          throw { status: 404 };
        }

        fields = UPDATE_VALIDATOR.postvalidateUpdate(reminder, fields);
        console.log(reminder);
        if (!fields) {
          return reminder;
        }
        
        var date = new Date(fields.deliverAt);
        
        Reminders.updateAttributes({
                assetId: fields.assetId
                }).then(function(reminder) {
                res.status(200).send('success');
                });
      })
    );
  }))
});

module.exports = router;
