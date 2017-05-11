var expect = require("chai").expect;
const requestlc = require("./common/requestlc");

requestlc.describe("Actions related to connections", function(client) {

  var theUser1, theUser2;

  function makeConnection(userId, peerId) {
    return client.makeRequest("PUT", "/api/connections/" + userId + "/" + peerId).asRoot().withData({
      grade: 1
    }).getJson();
  }

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
      return makeConnection(theUser1.id, theUser2.id);
    }).then(function() {
      return makeConnection(theUser2.id, theUser1.id);
    }).then(function() {
      done();
    })
    .catch(done);
  });

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

  function findAction(actionResponse, pred) {
    var actionGroups = actionResponse.actionGroups;
    expect(actionGroups).to.exist;
    for (var i = 0; i < actionGroups.length; ++i) {
      for (var j = 0; j < actionGroups[i].actions.length; ++j) {
        if (pred(actionGroups[i].actions[j])) {
          return actionGroups[i].actions[j];
        }
      }
    }
  }

  describe("with message thread of length 3", function() {

    var theMessages;

    beforeEach(function(done) {
      sendMessages([{ 
        fromUser: theUser1,
        assetId: 6,
        toUser: theUser2
      }, {
        fromUser: theUser2,
        assetId: 7,
        toUser: theUser1
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

    it("augments action list (1)", function(done) {
      client.makeRequest("GET", "/a").asUser(theUser1.id).getJson()
      .then(function(response) {
        var greetingAction = findAction(response, function(item) {
          return item.user && item.user.id == theUser2.id;
        });
        expect(greetingAction).to.exist;
        expect(greetingAction.thread).to.exist;
        expect(greetingAction.thread.length).to.equal(3);
        done();
      })
      .catch(done);
    });

    it("augments action list (2)", function(done) {
      client.makeRequest("GET", "/a").asUser(theUser2.id).getJson()
      .then(function(response) {
        var greetingAction = findAction(response, function(item) {
          return item.user && item.user.id == theUser1.id;
        });
        expect(greetingAction).to.exist;
        expect(greetingAction.thread).to.exist;
        expect(greetingAction.thread.length).to.equal(3);
        done();
      })
      .catch(done);
    });
  })
});
