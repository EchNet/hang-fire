const expect = require("chai").expect;
const requestlc = require("./common/requestlc");

requestlc.describe("Reminders API", function(client) {

  describe("get method", function() {

    var fromUserId = 1;

    var seedProperties = {
      dateStr: '2017-03-01T09:50:00.000Z',    
      assetId: 524,
      toUserId: 1,
      fromUserId: 1,    
      repeat: 'Yes',
      timeZone: 'Pacific'    
    };

    var goodReminderId;

    beforeEach(function(done) {
      client.makeRequest("POST", "/api/reminders").asUser(fromUserId).withData(seedProperties) 
      .getJson()
      .then(function(reminder) {
        goodReminderId = reminder.id;
        console.log('heres the good? reminder id:' + goodReminderId);  
        done();
      })
      .catch(done);
    });

    function get(id) {
      return client.makeRequest("GET", "/api/reminders/" + id);
    }

    it("is inaccessible without authorization", function(done) {
      get(goodReminderId).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });

    it("allows root to retrieve Reminder", function(done) {
      get(goodReminderId).asRoot().getJson()
      .then(function(reminder) {  
        expect(reminder.assetId).to.equal(seedProperties.assetId);
        expect(reminder.toUserId).to.equal(seedProperties.toUserId);
        done();
      })
      .catch(done);
    })

    it("returns 404 for missing ID", function(done) {
      get(goodReminderId*2 + 1).asRoot().go()
      .then(function(expector) {
        expector.expectStatusCode(404);
        done();
      })
      .catch(done);
    })
    
     it("deletes the given  reminder id", function(done) {
      delete(goodReminderId).asRoot().go()
      .then(function(reminder) { 
        expect(reminder.assetId).to.equal(goodReminderId);
        done();
      })
      .catch(done);
    })

    it("does not permit just anyone to retrieve Reminder", function(done) {
      get(goodReminderId).asUser(fromUserId * 2).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    })

    it("allows sender to retrieve message", function(done) {
      get(goodReminderId).asUser(fromUserId).getJson()
      .then(function(reminder) { 
        expect(reminder.assetId).to.equal(seedProperties.assetId);
        expect(reminder.toUserId).to.equal(seedProperties.toUserId);
        done();
      })
      .catch(done);
    });
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

  });
});
