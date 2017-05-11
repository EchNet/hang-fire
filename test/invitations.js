const expect = require("chai").expect;
const requestlc = require("./common/requestlc");

requestlc.describe("Invitation flow:", function(client) {

  const TEST_SENDER_NAME = "Jack";
  var TEST_RECEIVER_NAME = "Jodie";
  var TEST_EMAIL = "test@example.com";

  var theSender;
  var theAsset;
  var theInvite;

  // Methods...

  function createUser(name) {
    return client.makeRequest("POST", "/api/users")
    .withData({ name: name }).asRoot().getJson();
  }

  function createAsset(creatorId) {
    return client.makeRequest("POST", "/assets").asUser(creatorId).withData({
      mime: "audio/shmaudio",
      key: "abc",
      url: "http://example.com/notfound.wmf"
    }).getJson();
  }

  function sendInvitation(fromUserId, name, email, assetId) {
    return client.makeRequest("POST", "/api/invites")
    .asUser(fromUserId)
    .withData({
      assetId: assetId,
      name: name,
      email: email
    })
    .getJson();
  }
  
  function getTicket(ticketId) {
    return client.makeRequest("GET", "/api/tickets/" + ticketId).asRoot().getJson();
  }

  function claimTicket(ticket) {
    return client.makeRequest("GET", "/?e=" + ticket.externalId).go()
    .then(function(expector) {
      expector.expectRedirect("/");
      return expector.getSetCookie("s");
    });
  }

  function requestActionList(cred, credIsUserId) {
    var req = client.makeRequest("GET", "/a");
    credIsUserId ? req.asUser(cred) : req.withCookie("s", cred);
    return req.getJson();
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

  function findGreetingAction(actionResponse, toUserId) {
    return findAction(actionResponse, function(item) {
      return item.user && item.user.id == toUserId;
    });
  }

  function findInviteAction(actionResponse, fromUserId) {
    return findAction(actionResponse, function(item) {
      return item.invite && item.invite.fromUser && item.invite.fromUser.id == fromUserId;
    });
  }

  function findUpdateInviteAction(actionResponse) {
    return findAction(actionResponse, function(item) {
      return item.id.substring(0, 7) == "inv-upd";
    });
  }

  function cancelInvitation(id, userId) {
    return client.makeRequest("DELETE", "/api/invites/" + id).asUser(userId).getJson();
  }

  function acceptInvitation(inviteId, userId) {
    return client.makeRequest("POST", "/api/invites/" + inviteId + "/accept").asUser(userId).go();
  }

  function rejectInvitation(inviteId, userId) {
    return client.makeRequest("POST", "/api/invites/" + inviteId + "/reject").asUser(userId).go();
  }

  function setUserName(userId, name) {
    return client.makeRequest("PUT", "/api/users/" + userId).asUser(userId).withData({ name: name }).getJson();
  }

  // Create an invitation and its prerequisites.
  beforeEach(function(done) {
    createUser(TEST_SENDER_NAME)
    .then(function(user) {
      expect(user.name).to.equal(TEST_SENDER_NAME);
      theSender = user;
      return createAsset(theSender.id);
    })
    .then(function(asset) {
      theAsset = asset;
      return sendInvitation(theSender.id, TEST_RECEIVER_NAME, TEST_EMAIL, theAsset.id)
    })
    .then(function(invite) {
      theInvite = invite;
      expect(theInvite.fromUserId).to.equal(theSender.id);
      expect(theInvite.assetId).to.equal(theAsset.id);
      expect(theInvite.recipientName).to.equal(TEST_RECEIVER_NAME);
      done();
    })
    .catch(done);
  });

  it("Sent invitations appear in sender's action list", function(done) {
    requestActionList(theSender.id, true)
    .then(function(actionResponse) {
      expect(actionResponse.user).to.exist;
      expect(parseInt(actionResponse.user.id)).to.equal(theSender.id);
      var updInvAction = findUpdateInviteAction(actionResponse);
      expect(updInvAction).to.exist;
      done();
    })
    .catch(done);
  });

  describe("Acting on an invite", function() {

    var inviteAction;
    var theSessionCookie;
    var theActionResponse;

    beforeEach(function(done) {
      // Holder of the email account claims ticket.
      getTicket(theInvite.ticketId)
      .then(function(ticket) {
        return claimTicket(ticket);
      })
      .then(function(sessionCookie) {
        expect(sessionCookie).to.exist;
        theSessionCookie = sessionCookie;
        return requestActionList(sessionCookie);
      })
      .then(function(actionResponse) {
        expect(actionResponse.user).to.exist;
        expect(actionResponse.user.id).to.exist;
        expect(actionResponse.user.id).to.not.equal(theSender.id);
        // User must set name to receive invite from the sender.
        return setUserName(actionResponse.user.id, "Fred");
      })
      .then(function(user) {
        expect(user.name).to.equal("Fred");
        return requestActionList(theSessionCookie);
      })
      .then(function(actionResponse) {
        theActionResponse = actionResponse;
        inviteAction = findInviteAction(actionResponse, theSender.id);
        done();
      })
      .catch(done);
    });

    it("results in an item in the receiver's action list", function(done) {
      expect(inviteAction).to.exist;
      expect(typeof inviteAction.id).to.equal("string");
      expect(inviteAction.id.substring(0, 7)).to.equal("inv-rec");
      done();
    });

    describe("and accepting it", function() {

      beforeEach(function(done) {
        acceptInvitation(inviteAction.invite.id, theActionResponse.user.id)
        .then(function() {
          done();
        })
        .catch(done);
      });

      it("adds receiver to sender's connection list", function(done) {
        requestActionList(theSender.id, true)
        .then(function(actionResponse) {
          expect(actionResponse.user).to.exist;
          expect(parseInt(actionResponse.user.id)).to.equal(theSender.id);
          var greetingAction = findGreetingAction(actionResponse, theActionResponse.user.id);
          expect(greetingAction).to.exist;
          expect(greetingAction.thread).to.exist;
          expect(greetingAction.thread.length).to.equal(1);
          expect(greetingAction.thread[0].type).to.equal(1);
          done();
        })
        .catch(done);
      });

      it("closes the invitation", function(done) {
        requestActionList(theActionResponse.user.id, true)
        .then(function(newActionResponse) {
          inviteAction = findInviteAction(newActionResponse, theSender.id);
          expect(inviteAction).to.not.exist;
          done();
        })
        .catch(done);
      });
    });

    describe("and rejecting it", function() {

      beforeEach(function(done) {
        rejectInvitation(inviteAction.invite.id, theActionResponse.user.id)
        .then(function() {
          done();
        })
        .catch(done);
      });

      it("closes the invitation", function(done) {
        requestActionList(theActionResponse.user.id, true)
        .then(function(newActionResponse) {
          inviteAction = findInviteAction(newActionResponse, theSender.id);
          expect(inviteAction).to.not.exist;
          done();
        })
        .catch(done);
      });

      it("does not add receiver to sender's connection list", function(done) {
        requestActionList(theSender.id, true)
        .then(function(actionResponse) {
          expect(actionResponse.user).to.exist;
          expect(parseInt(actionResponse.user.id)).to.equal(theSender.id);
          var greetingAction = findGreetingAction(actionResponse, theActionResponse.user.id);
          expect(greetingAction).to.not.exist;
          done();
        })
        .catch(done);
      });
    });
  });

  describe("cancelled...", function(done) {

    var theSessionCookie;

    beforeEach(function(done) {
      // The sender cancels the invitation before it is received.
      cancelInvitation(theInvite.id, theSender.id)
      .then(function() {
        return getTicket(theInvite.ticketId);
      })
      .then(function(ticket) {
        return claimTicket(ticket);
      })
      .then(function(sessionCookie) {
        // Ticket is not voided.
        expect(sessionCookie).to.exist;
        theSessionCookie = sessionCookie;
        done();
      })
      .catch(done);
    });

    it("suppress delivery of the message", function(done) {
      requestActionList(theSessionCookie)
      .then(function(actionResponse) {
        // Action list is expected not to contain a message from the sender.
        var inviteAction = findInviteAction(actionResponse, theSender.id);
        expect(inviteAction).to.not.exist;
        done();
      })
      .catch(done);
    });

    it("no longer appear in sender's action list", function(done) {
      requestActionList(theSender.id, true)
      .then(function(actionResponse) {
        var updInvAction = findUpdateInviteAction(actionResponse);
        expect(updInvAction).to.not.exist;
        done();
      })
      .catch(done);
    });
  });
});
