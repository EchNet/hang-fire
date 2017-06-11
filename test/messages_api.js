const expect = require("chai").expect;
const requestlc = require("./common/requestlc");

requestlc.describe("Messages API", function(client) {

  var theUser1, theUser2;
  var asset;

  beforeEach(function(done) {
    client.makeRequest("POST", "/api/profile").asRoot().withData({
      assetId: 1,
      name: "User 1"
    }).getJson().then(function(user) {
      theUser1 = user;
      return client.makeRequest("POST", "/api/profile").asRoot().withData({
        assetId: 2,
        name: "User 2"
      }).getJson();
    }).then(function(user) {
      theUser2 = user;
      return client.makeRequest("POST", "/assets").asRoot().withData({
        userId: theUser1.id,
        mime: "video/webm",
        key: "123",
        url: "456"
      });
    }).then(function(_asset) {
      asset = _asset;
      done();
    })
    .catch(done);
  });

  describe("get method", function() {

    var seedProperties;

    var goodMessageId;

    beforeEach(function(done) {
      seedProperties = {
        assetId: 5,
        toUserId: theUser2.id,
        type: 1
      };
      client.makeRequest("POST", "/api/messages").asUser(theUser1.id).withData(seedProperties) 
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

    it("is inaccessible without authorization", function(done) {
      get(goodMessageId).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });

    it("allows root to retrieve message", function(done) {
      get(goodMessageId).asRoot().getJson()
      .then(function(message) {
        expect(message.assetId).to.equal(seedProperties.assetId);
        expect(message.toUserId).to.equal(seedProperties.toUserId);
        done();
      })
      .catch(done);
    })

    it("returns 404 for missing ID", function(done) {
      get(goodMessageId*2 + 1).asRoot().go()
      .then(function(expector) {
        expector.expectStatusCode(404);
        done();
      })
      .catch(done);
    })

    it("does not permit just anyone to retrieve message", function(done) {
      get(goodMessageId).asUser(theUser1.id * 2).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    })

    it("allows sender to retrieve message", function(done) {
      get(goodMessageId).asUser(theUser1.id).getJson()
      .then(function(message) {
        expect(message.assetId).to.equal(seedProperties.assetId);
        expect(message.toUserId).to.equal(seedProperties.toUserId);
        done();
      })
      .catch(done);
    });
  });

  describe("post method", function() {

    function post(data) {
      return client.makeRequest("POST", "/api/messages").withData(data);
    }

    it("is inaccessible without authorization", function(done) {
      post({}).go().then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });

    it("defaults to greeting type", function(done) {
      post({
        assetId: 22,
        toUserId: theUser1.id
      }).asUser(theUser2.id).getJson()
      .then(function(message) {
        expect(message.type).to.equal(0);
        done();
      })
      .catch(done);
    })

    it("requires recipient for greeting type", function(done) {
      post({
        type: 0,
        assetId: 1
      }).asUser(12).go().then(function(expector) {
        expector.expectStatusCode(500);
        expect(expector.getJson().toUserId).to.equal("?");
        done();
      })
      .catch(done);
    })

    it("announcements may not be posted without admin auth", function(done) {
      post({
        type: 3,
        assetId: 1
      }).asUser(12).go().then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    })
  });

  /********

  describe("put method", function() {

    var messageId;

    it("is inaccessible without authorization", function(done) {
      request({
        method: "PUT",
        url: url + "/1"
      }, function(error, response, body) {
        expect(response.statusCode).to.equal(401);
        done();
      });
    });

    it("returns 404 for bad id", function(done) {
      request({
        method: "PUT",
        url: url + "/" + (goodMessageId - 1),
        headers: rootHeaders
      }, function(error, response, body) {
        expect(response.statusCode).to.equal(404);
        done();
      });
    })

    it("permits change in assetId", function(done) {
      request({
        method: "PUT",
        url: url + "/" + goodMessageId,
        headers: rootHeaders,
        form: {
          assetId: seedProperties.assetId + 1
        }
      }, function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        expect(message.assetId).to.equal(seedProperties.assetId + 1);
        done();
      });
    })
  })

  describe("delete method", function() {

    it("is inaccessible without authorization", function(done) {
      request({
        method: "DELETE",
        url: url + "/" + goodMessageId
      }, function(error, response, body) {
        expect(response.statusCode).to.equal(401);
        done();
      });
    });

    it("returns 404 for missing ID", function(done) {
      request({
        method: "DELETE",
        url: url + "/" + (goodMessageId - 1),
        headers: rootHeaders
      }, function(error, response, body) {
        expect(response.statusCode).to.equal(404);
        done();
      });
    })

    it("deletes message", function(done) {
      request({
        method: "DELETE",
        url: url + "/" + goodMessageId,
        headers: rootHeaders
      }, function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        request({
          method: "GET",
          url: url + "/" + goodMessageId,
          headers: rootHeaders
        }, function(error, response, body) {
          expect(response.statusCode).to.equal(404);
          done();
        });
      });
    })
  });

  *******/
});
