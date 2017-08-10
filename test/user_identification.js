var expect = require("chai").expect;
const requestlc = require("./common/requestlc");

requestlc.describe("Action list", function(client) {

  const NAME = "Josephine";
  var theUser;

  beforeEach(function(done) {
    client.createUser(NAME).then(function(user) {
      theUser = user;
      done();
    })
    .catch(done)
  });

  it("includes user name", function(done) {
    client.fetchActionList(theUser.id)
    .then(function(actionResponse) {
      expect(actionResponse.user).to.exist;
      expect(actionResponse.user.name).to.equal(NAME);
      expect(actionResponse.user.email).to.not.exist;
      done();
    })
    .catch(done)
  });

  it("includes email if present", function(done) {
    var email = client.uid() + "@example.com";
    client.createEmailProfile(theUser.id, email)
    .then(function(emailProfile) {
      return client.fetchActionList(theUser.id);
    })
    .then(function(actionResponse) {
      expect(actionResponse.user).to.exist;
      expect(actionResponse.user.email).to.equal(email.toLowerCase());
      done();
    })
    .catch(done);
  });
});

