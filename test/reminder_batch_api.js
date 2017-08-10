const expect = require("chai").expect;
const requestlc = require("./common/requestlc");
const extend = require("extend");

requestlc.describe("Reminders processing", function(client) {

  const PATH = "/api/reminders";

  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  function postReminder(data) {
    return client.makeRequest("POST", PATH).asUser(80).withData(extend({
      assetId: 524,
      toUserId: 11,
      timeZone: "Eastern"
    }, data)).getJson();
  }

  function processReminders(date) {
    var uri = PATH + "/refresh";
    if (date) {
      uri += "?date=" + encodeURIComponent(date.toISOString());
    }
    return client.makeRequest("POST", uri).asRoot().getJson();
  }

  beforeEach(function(done) {
    client.deleteAllReminders().then(function(){ done() }).catch(done);
  });

  it("does not send message prematurely", function(done) {
    var deliverAt = new Date();
    deliverAt.setYear(deliverAt.getYear() + 1);
    postReminder({ deliverAt: deliverAt.toISOString() })
    .then(function(reminder) {
      return processReminders();
    })
    .then(function(result) {
      expect(result.activeReminders.length).to.equal(1);
      expect(result.messagesSent.length).to.equal(0);
      done();
    })
    .catch(done);
  });

  it("sends message when it's time", function(done) {
    postReminder({ deliverAt: new Date().toISOString() })
    .then(function(reminder) {
      return processReminders();
    })
    .then(function(result) {
      expect(result.activeReminders.length).to.equal(1);
      expect(result.messagesSent.length).to.equal(1);
      done();
    })
    .catch(done);
  });

  it("sends message even if it's a little late", function(done) {
    var deliverAt = new Date(new Date().getTime() - ONE_HOUR);
    postReminder({ deliverAt: deliverAt.toISOString() })
    .then(function(reminder) {
      return processReminders();
    })
    .then(function(result) {
      expect(result.activeReminders.length).to.equal(1);
      expect(result.messagesSent.length).to.equal(1);
      done();
    })
    .catch(done);
  });

  it("does not send message if too much time has passed", function(done) {
    var deliverAt = new Date(new Date().getTime() - 2*ONE_HOUR);
    postReminder({ deliverAt: deliverAt.toISOString() })
    .then(function(reminder) {
      return processReminders();
    })
    .then(function(result) {
      expect(result.activeReminders.length).to.equal(1);
      expect(result.messagesSent.length).to.equal(0);
      done();
    })
    .catch(done);
  });

  it("expires non-repeat message", function(done) {
    postReminder({ deliverAt: new Date().toISOString() })
    .then(function(reminder) {
      return processReminders();
    })
    .then(function(result) {
      expect(result.activeReminders.length).to.equal(1);
      expect(result.messagesSent.length).to.equal(1);
      return processReminders();
    })
    .then(function(result) {
      expect(result.activeReminders.length).to.equal(0);
      expect(result.messagesSent.length).to.equal(0);
      done();
    })
    .catch(done);
  });

  it("sends second message the next day for repeating reminder", function(done) {
    var deliverAt = new Date();
    postReminder({
      deliverAt: deliverAt.toISOString(),
      repeat: 1
    })
    .then(function(reminder) {
      return processReminders();
    })
    .then(function(result) {
      expect(result.activeReminders.length).to.equal(1);
      expect(result.messagesSent.length).to.equal(1);
      return processReminders(new Date(deliverAt.getTime() + ONE_DAY));
    })
    .then(function(result) {
      expect(result.activeReminders.length).to.equal(1);
      expect(result.messagesSent.length).to.equal(1);
      done();
    })
    .catch(done);
  });
});
