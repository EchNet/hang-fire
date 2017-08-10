var expect = require("chai").expect;
const requestlc = require("./common/requestlc");

requestlc.describe("Assets API", function(client) {

  const PATH = "/assets";

  describe("post method", function() {

    it("is inaccessible without authorization", function(done) {
      client.makeRequest("POST", PATH).go()
      .then(function(expector) {
        expector.expectStatusCode(401);
        done();
      })
      .catch(done);
    });

    it("is accessible with authorization", function(done) {
      client.makeRequest("POST", PATH).asUser(1).withContentType("video/webm").withData("12345").go()
      .then(function(expector) {
        expector.expectStatusCode(200);
        done();
      })
      .catch(done);
    });
  });
});
