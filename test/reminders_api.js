const expect = require("chai").expect;
const requestlc = require("./common/requestlc");

requestlc.describe("Reminders API", function(client) {

  const PATH = "/api/reminders";

  describe("get method", function() {

    var deliverAt = "2030-01-01T02:00:00-05:00";    
    var fromUserId = 10;
    var toUserId = 11;
    var assetId = 524;
    var timeZone = "Eastern";
    var theReminder;

    function expectReminderToMatchInputs(reminder) {
      expect(reminder.deliverAt).to.equal(deliverAt);
      expect(reminder.assetId).to.equal(assetId);
      expect(reminder.toUserId).to.equal(toUserId);
      expect(reminder.fromUserId).to.equal(fromUserId);
      expect(reminder.assetId).to.equal(assetId);
      expect(reminder.repeat).to.equal(1);
      expect(reminder.timeZone).to.equal(timeZone);
    }

    beforeEach(function(done) {
      client.makeRequest("POST", PATH).asUser(fromUserId).withData({
        deliverAt: deliverAt,
        assetId: assetId,
        toUserId: toUserId,
        repeat: 1,
        timeZone: timeZone
      }).getJson()
      .then(function(reminder) {
        theReminder = reminder;
        expectReminderToMatchInputs(reminder);
        done();
      })
      .catch(done);
    });

    it("Retrieves reminder", function(done) {
      client.makeRequest("GET", PATH + "/" + theReminder.id).asRoot().getJson()
      .then(function(reminder) {  
        expectReminderToMatchInputs(reminder);
        done();
      })
      .catch(done);
    });

    it("Retrieves reminder as sender", function(done) {
      client.makeRequest("GET", PATH + "/" + theReminder.id).asUser(fromUserId).getJson()
      .then(function(reminder) {
        expectReminderToMatchInputs(reminder);
        done();
      })
      .catch(done);
    });

    it("Fails to retrieve invalid reminder", function(done) {
      client.makeRequest("GET", PATH + "/" + (theReminder.id + 1)).asRoot().go()
      .then(function(expector) {
        expector.expectStatusCode(404);
        done();
      })
      .catch(done);
    });

    it("Fails to retrieve reminder as other user", function(done) {
      client.makeRequest("GET", PATH + "/" + theReminder.id).asUser(toUserId).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });
  });

  describe("delete method", function() {

    var fromUserId = 1;

    var seedProperties = {
      deliverAt: '2017-03-11T02:00:00-08:00',    
      assetId: 524,
      toUserId: 1,
      repeat: 1,
      timeZone: 'Pacific'    
    };

    var goodReminderId;

    beforeEach(function(done) {
      client.makeRequest("POST", PATH).asUser(fromUserId).withData(seedProperties) 
      .getJson()
      .then(function(reminder) {
        goodReminderId = reminder.id;  
        done();
      })
      .catch(done);
    });

    it("deletes the given reminder id", function(done) {     
      client.makeRequest("DELETE", PATH + "/" + goodReminderId).asUser(fromUserId) 
      .getJson()
      .then(function(expector) {  
         expect(expector).to.equal(1);
        done();
      })
      .catch(done);
    })

    it("does not permit just anyone to delete Reminder", function(done) {
      client.makeRequest("DELETE", PATH + "/" + goodReminderId).asUser(fromUserId * 2).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    })
  });

  describe("post method", function() {

    function post(data) {
      return client.makeRequest("POST", "/api/reminders").withData(data);
    }

    it("is inaccessible without authorization", function(done) {
      post({}).go().then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });
      
    it("Creates a reminder for the given user Id", function(done) {
      post({
      deliverAt: '2017-03-11T02:00:00-08:00',    
      assetId: 524,
      toUserId: 1,
      repeat: 1,
      timeZone: 'Pacific'
      }).asUser(1).getJson()
      .then(function(reminder) {  
        expect(reminder.assetId).to.equal(524);
        done();
      })
      .catch(done);
    })  

  });
});
