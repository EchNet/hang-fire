var expect = require("chai").expect;
const requestlc = require("./common/requestlc");

requestlc.describe("Threads API", function(client) {

  var theUser1, theUser2;

  beforeEach(function(done) {
    client.createUserProfile("User 1")
    .then(function(user) {
      theUser1 = user;
      return client.createUserProfile("User 2")
    }).then(function(user) {
      theUser2 = user;
      done();
    })
    .catch(done);
  });

  function getThread(user1Id, user2Id, options) {
    var uri = "/api/threads/" + user1Id + "/" + user2Id;
    var query = "";
    if (options && "limit" in options) {
      query += (query.length ? "&" : "?") + "limit=" + options.limit;
    }
    if (options && "before" in options) {
      query += (query.length ? "&" : "?") + "before=" + encodeURIComponent(options.before);
    }
    return client.makeRequest("GET", uri + query);
  }

  function sendMessages(specs) {
    return new Promise(function(resolve) {
      var index = 0;
      var messages = [];
      (function sendNext() {
        if (index < specs.length) {
          var spec = specs[index++];
          client.makeRequest("POST", "/api/messages").asUser(spec.fromUser.id)
          .withData({
            assetId: spec.assetId,
            toUserId: spec.toUser.id
          }).getJson()
          .then(function(message) {
            messages.push(message);
            sendNext();
          });
        }
        else {
          resolve(messages);
        }
      })();
    });
  }

  it("is inaccessible without authorization", function(done) {
    getThread(theUser1.id, theUser2.id).go()
    .then(function(expector) {
      expector.expectStatusCode(401);
      done();
    })
    .catch(done);
  });

  it("returns 404 for missing user (1)", function(done) {
    getThread(theUser1.id * 2, theUser2.id).asRoot().go()
    .then(function(expector) {
      expector.expectStatusCode(404);
      done();
    })
    .catch(done);
  })

  it("returns 404 for missing user (2)", function(done) {
    getThread(theUser1.id, theUser2.id * 2).asRoot().go()
    .then(function(expector) {
      expector.expectStatusCode(404);
      done();
    })
    .catch(done);
  })

  it("returns empty array if there are no messages", function(done) {
    getThread(theUser1.id, theUser2.id).asUser(theUser1.id).getJson()
    .then(function(thread) {
      expect(thread.length).to.equal(0);
      done();
    })
    .catch(done);
  })

  it("returns message sent from user 1 to user 2", function(done) {
    sendMessages([{ 
      fromUser: theUser1,
      assetId: 5,
      toUser: theUser2
    }])
    .then(function() {
      return getThread(theUser1.id, theUser2.id).asUser(theUser1.id).getJson();
    })
    .then(function(thread) {
      expect(thread.length).to.equal(1);
      expect(thread[0].assetId).to.equal(5);
      done();
    })
    .catch(done);
  })

  it("returns message sent from user 2 to user 1", function(done) {
    sendMessages([{ 
      fromUser: theUser2,
      assetId: 5,
      toUser: theUser1
    }])
    .then(function() {
      return getThread(theUser1.id, theUser2.id).asUser(theUser1.id).getJson();
    })
    .then(function(thread) {
      expect(thread.length).to.equal(1);
      expect(thread[0].assetId).to.equal(5);
      done();
    })
    .catch(done);
  })

  describe("with thread of length 3", function() {

    var theMessages;

    beforeEach(function(done) {
      sendMessages([{ 
        fromUser: theUser2,
        assetId: 6,
        toUser: theUser1
      }, {
        fromUser: theUser1,
        assetId: 7,
        toUser: theUser2
      }, {
        fromUser: theUser1,
        assetId: 8,
        toUser: theUser2
      }])
      .then(function(messages) {
        theMessages = messages;
        done();
      })
      .catch(done);
    });

    it("returns most recent first", function(done) {
      getThread(theUser1.id, theUser2.id).asUser(theUser1.id).getJson()
      .then(function(thread) {
        expect(thread.length).to.equal(3);
        expect(thread[0].assetId).to.equal(8);
        done();
      })
      .catch(done);
    });

    it("supports limit option", function(done) {
      getThread(theUser1.id, theUser2.id, { limit: 1 }).asUser(theUser1.id).getJson()
      .then(function(thread) {
        expect(thread.length).to.equal(1);
        expect(thread[0].assetId).to.equal(8);
        done();
      })
      .catch(done);
    });

    it("supports 'before' option", function(done) {
      getThread(theUser1.id, theUser2.id, { before: theMessages[2].updatedAt }).asUser(theUser1.id).getJson()
      .then(function(thread) {
        expect(thread.length).to.equal(2);
        expect(thread[0].assetId).to.equal(7);
        done();
      })
      .catch(done);
    });
  })
});
