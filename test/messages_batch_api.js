const expect = require("chai").expect;
const requestlc = require("./common/requestlc");
const fs = require("fs");
var goodMessageId;

requestlc.describe("Messages Batch API", function(client) {

  describe("get method", function() {

    var fromUserId = 3;

    var seedProperties = {
      assetId: 5,
      toUserId: 4,
      type: 1
    };

    

    beforeEach(function(done) {
      client.makeRequest("POST", "/api/messages").asUser(fromUserId).withData(seedProperties) 
      .getJson()
      .then(function(message) {
        goodMessageId = message.id;
        done();
      })
      .catch(done);
    });

    function get(id) {
      return client.makeRequest("GET", "/api/messages/" + id);
    }


    it("It has created a new Message with timestamp of NOW", function(done) {
      get(goodMessageId).asRoot().getJson()
      .then(function(message) {
        expect(message.toUserId).to.equal(seedProperties.toUserId);
        done();
      })
      .catch(done);
    })
  });

  describe("post method", function() {
    var currDate = new Date();
    var futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 1);

    function post(currTime) {
      return client.makeRequest("POST", "/api/messages/sendreminders/" + currTime);
    }
    

    it("running reminder batch with current time does not send reminders", function(done) {
      post(currDate).go().then(function(expector) {
       expector.expectStatusCode(401);
       done();
      })
      .catch(done);
    });


    it("running reminder batch with future time sends reminders", function(done) {
      post(futureTime).go().then(function(expector) {
      var receiverHTML = fs.readFileSync("tmp/receiver").toString();
      var senderHTML = fs.readFileSync("tmp/sender").toString();
      expect(receiverHTML.indexOf("has sent you a message that has not been viewed by you")).gt(0);
      expect(senderHTML.indexOf("A message you have sent to")).gt(0);
      done();
      })
      .catch(done);
    });


    it("running reminder batch with future time again does not send reminders", function(done) {
      post(futureTime).go().then(function(expector) {
      expector.expectStatusCode(401);
      done();
      })
      .catch(done);
    });

  });
});
