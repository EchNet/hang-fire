var expect = require("chai").expect;
const requestlc = require("./common/requestlc");

requestlc.describe("Message views", function(client) {

  var theUser1, theUser2;
  var theMessage;

  function makeUser(name) {
    return client.makeRequest("POST", "/api/profile").asRoot().withData({
      assetId: 2,
      name: name
    }).getJson();
  }

  function makeConnection(userId, peerId) {
    return client.makeRequest("PUT", "/api/connections/" + userId + "/" + peerId).asRoot().withData({
      grade: 1
    }).getJson();
  }

  function makeMessage(fromUser, toUser, assetId) {
    return client.makeRequest("POST", "/api/messages").asUser(fromUser.id)
    .withData({
      assetId: assetId,
      toUserId: toUser.id
    }).getJson()
  }

  function logViewEvent(userId, messageId) {
    return client.makeRequest("POST", "/api/events").asUser(userId)
    .withData({
      type: "view",
      messageId: messageId
    }).getJson();
  }

  function getUserActions(user) {
    return client.makeRequest("GET", "/a").asUser(user.id).getJson();
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

  function findInboxMessage(userActions, prefix, fromUser) {
    return findAction(userActions, function(item) {
      return item.id.startsWith(prefix) && item.id.endsWith(fromUser.id);
    });
  }

  beforeEach(function(done) {
    makeUser("User 1")
    .then(function(user) {
      theUser1 = user;
      return makeUser("User 2");
    }).then(function(user) {
      theUser2 = user;
      return makeConnection(theUser1.id, theUser2.id);
    }).then(function() {
      return makeConnection(theUser2.id, theUser1.id);
    }).then(function() {
      return makeMessage(theUser1, theUser2, 33);
    }).then(function(message) {
      theMessage = message;
      done();
    })
    .catch(done);
  });

  it("cause messages to disappear from inbox", function(done) {
    getUserActions(theUser2).then(function(userActions) {
      var greetingAction = findInboxMessage(userActions, "gre-", theUser1);
      expect(greetingAction).to.exist;
      var connAction = findInboxMessage(userActions, "con-", theUser1);
      expect(connAction).to.exist;
      expect(connAction.thread).to.exist;
      expect(connAction.thread.length).to.equal(1);
      expect(connAction.thread[0].id).to.equal(theMessage.id);
      return logViewEvent(theUser2.id, theMessage.id);
    }).then(function() {
      return getUserActions(theUser2);
    }).then(function(userActions) {
      var greetingAction = findInboxMessage(userActions, "gre-", theUser1);
      expect(greetingAction).to.not.exist;
      done();
    }).catch(done);
  });
});
