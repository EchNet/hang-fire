const expect = require("chai").expect;
const requestlc = require("./common/requestlc");

requestlc.describe("Set seed reminder flow:", function(client) {

  const TEST_SENDER_NAME = "Jack";
  var TEST_RECEIVER_NAME = "Jodie";
  var TEST_EMAIL = "test@example.com",
   DATE_STR ='2017-03-01T09:50:00.000Z',
   VID =524,
   YEAR=2017,
   DAY=3,
   MONTH=3,
   HR=8,
   MIN=15,
   FROMUSERID=2,
   TOUSERID=1,
   REPEAT='Yes',
   TIMEZONE='Eastern';    

  var theSender;
  var theAsset;
  var theInvite;

  // Methods...

  function sendReminder(dateStr, vid, year, day, month, hr, min, fromuserid, touserid, repeat, timeZone) {
    return client.makeRequest("POST", "/routers/createReminder")
    .withData({
      dateStr: dateStr,
      vid: vid,
      year: year,
      day: day,
      month: month,
      hr: hr,
      min: min,
      fromuserid: fromuserid,
      touserid: touserid,
      repeat: repeat,
      timeZone:'Eastern'    
    })
    .getJson();
  }
  
    
describe("creating a new seed Reminder", function() {
it('creates a new seed reminder' , function() {
   sendReminder(DATE_STR, VID, YEAR, DAY, MONTH, HR, MIN, FROMUSERID, TOUSERID, REPEAT, TIMEZONE)
   .then(function(reminder) {
      theReminder = reminder;
      expect(theReminder.fromUserId).to.equal(theSender.id);
      expect(theReminder.assetId).to.equal(theAsset.id);
      expect(theReminder.toUserId).to.equal(theReceiver.id);
      done();
    })

    });

   }); 
  });

