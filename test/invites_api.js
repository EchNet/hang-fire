var expect = require("chai").expect;
const requestlc = require("./common/requestlc");
const fs = require("fs");

requestlc.describe("Invites API", function(client) {
  const PATH = "/api/invites";

  const fromUserId = 4;
  var theAsset;
  const name = "Fred"
  const email = "test@example.com";
  var theInvite;

  beforeEach(function(done) {
    fs.unlinkSync("tmp/email");
    client.createAsset(fromUserId)
    .then(function(asset) {
      theAsset = asset;
      return client.makeRequest("POST", PATH).asUser(fromUserId).withData({
        assetId: theAsset.id,
        name: name,
        email: email
      }).getJson();
    })
    .then(function(invite) {
      theInvite = invite;
      expect(invite.state).to.equal(0);
      expect(invite.ticketId).to.exist;
      done();
    })
    .catch(done);
  });

  describe("get method", function() {

    it("is inaccessible without authorization", function(done) {
      client.makeRequest("GET", PATH + "/" + theInvite.id).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });

    it("returns 404 for missing ID", function(done) {
      client.makeRequest("GET", PATH + "/" + (theInvite.id + 1)).asUser(fromUserId).go()
      .then(function(expector) {
        expector.expectStatusCode(404);
        done();
      })
      .catch(done);
    })

    it("retrieves invite", function(done) {
      client.makeRequest("GET", PATH + "/" + theInvite.id)
      .asUser(fromUserId).getJson()
      .then(function(invite) {
        expect(invite.fromUserId).to.equal(fromUserId);
        expect(invite.assetId).to.equal(theAsset.id);
        expect(invite.recipientName).to.equal(name);
        expect(invite.ticketId).to.exist;
        done();
      })
      .catch(done);
    })

    it("allows only the creator to view invite", function(done) {
      client.makeRequest("GET", PATH + "/" + theInvite.id).asUser(fromUserId + 1).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    })
  });

  describe("post method", function() {

    it("is inaccessible without authorization", function(done) {
      client.makeRequest("POST", PATH).withData({
        assetId: 3,
        name: "Bob",
        email: "bob@dobbs.com"
      }).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });

    it("rejects invalid email", function(done) {
      client.makeRequest("POST", PATH).asUser(fromUserId).withData({
        assetId: 3,
        name: "blah",
        email: "blah"
      }).go()
      .then(function(expector) {
        expector.expectStatusCode(500);
        done();
      })
      .catch(done);
    });

    it("creates a ticket", function(done) {
      client.makeRequest("GET", "/api/tickets/" + theInvite.ticketId).asUser(fromUserId).getJson()
      .then(function(ticket) {
        expect(ticket.email).to.equal(email);
        done();
      })
      .catch(done);
    });

    it("sends email", function(done) {
      var html = fs.readFileSync("tmp/email").toString();
      client.makeRequest("GET", "/api/tickets/" + theInvite.ticketId).asUser(fromUserId).getJson()
      .then(function(ticket) {
        expect(html.indexOf("Hi, " + name + "!")).gt(0);
        expect(ticket.externalId).to.exist;
        expect(html.indexOf(ticket.externalId)).gt(0);
        done();
      })
      .catch(done);
    });
  });

  describe("put method", function() {

    it("is inaccessible without authorization", function(done) {
      client.makeRequest("PUT", PATH + "/" + theInvite.id).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });

    it("returns 404 for bad id", function(done) {
      client.makeRequest("PUT", PATH + "/" + (theInvite.id + 1)).asRoot().go()
      .then (function(expector) {
        expector.expectStatusCode(404);
        done();
      })
      .catch(done);
    })

    it("rejects change to email", function(done) {
      client.makeRequest("PUT", PATH + "/" + theInvite.id).asUser(fromUserId).withData({
        email: "jr_" + email
      }).go()
      .then(function(expector) {
        expector.expectStatusCode(500);
        done();
      })
      .catch(done);
    })

    it("permits change to assetId", function(done) {
      client.makeRequest("PUT", PATH + "/" + theInvite.id).asUser(fromUserId).withData({
        assetId: theAsset.id + 1
      }).getJson()
      .then(function(newInvite) {
        expect(newInvite.id).to.equal(theInvite.id);
        expect(newInvite.fromUserId).to.equal(fromUserId);
        expect(newInvite.assetId).to.equal(theAsset.id + 1);
        expect(newInvite.recipientName).to.equal(name);
        done();
      })
      .catch(done);
    })
  })

  describe("delete method", function() {

    it("is inaccessible without authorization", function(done) {
      done();
    });

    it("returns 404 for missing ID", function(done) {
      done();
    })

    it("deletes message", function(done) {
      done();
    })
  });

  function actOnInviteError(action, messageId, userId, expectedStatusCode) {
    return client.makeRequest("GET", "/api/messages/" + messageId + "?act=" + action)
    .asUser(userId).go()
    .then(function(expector) {
      expector.expectStatusCode(expectedStatusCode);
    });
  }

  describe("state management", function() {

    var toUserId = fromUserId + 11;

    // Make each invitation look as if it has been clicked on.
    beforeEach(function(done) {
      client.makeRequest("POST", PATH + "/" + theInvite.id + "/respond")
      .asUser(toUserId).getJson()
      .then(function(invite) {
        expect(invite.id).to.equal(theInvite.id);
        expect(invite.toUserId).to.equal(toUserId);
        expect(invite.state).to.equal(1);
        theInvite = invite;
        done();
      })
      .catch(done);
    });

    it("respond method makes the proper updates", function(done) {
      client.makeRequest("GET", PATH + "/" + theInvite.id)
      .asUser(fromUserId).getJson()
      .then(function(invite) {
        expect(invite.state).to.equal(1);
        expect(invite.toUserId).to.equal(toUserId);
        done();
      })
      .catch(done);
    });

    it("permits the recipient to accept", function(done) {
      client.makeRequest("POST", PATH + "/" + theInvite.id + "/accept")
      .asUser(toUserId).getJson()
      .then(function(invite) {
        expect(invite.state).to.equal(2);
        done();
      })
      .catch(done);
    });

    it("permits only the recipient to accept", function(done) {
      client.makeRequest("POST", PATH + "/" + theInvite.id + "/accept")
      .asUser(fromUserId).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });

    it("allows an invitation to be accepted twice", function(done) {
      return client.makeRequest("POST", PATH + "/" + theInvite.id + "/accept")
      .asUser(toUserId).getJson()
      .then(function() {
        return client.makeRequest("POST", PATH + "/" + theInvite.id + "/accept")
        .asUser(toUserId).getJson();
      })
      .then(function() {
        done();
      })
      .catch(done);
    });

    it("permits the recipient to reject", function(done) {
      client.makeRequest("POST", PATH + "/" + theInvite.id + "/reject")
      .asUser(toUserId).getJson()
      .then(function(invite) {
        expect(invite.state).to.equal(3);
        done();
      })
      .catch(done);
    });

    it("permits only the recipient to reject", function(done) {
      client.makeRequest("POST", PATH + "/" + theInvite.id + "/reject")
      .asUser(fromUserId).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });
  });
});
