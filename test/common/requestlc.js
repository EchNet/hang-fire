const requestexpect = require("./requestexpect");
const random = require("../../server/util/random");

function uid() {
  return random.id();
}

function makeRequest(method, uri) {
  return requestexpect.makeRequest(method, uri);
}

function createUser(name, level) {
  var data = { name: name }
  if (level != null) data.level = level;
  return makeRequest("POST", "/api/users").withData(data).asRoot().getJson();
}

function createAsset(creatorId) {
  return makeRequest("POST", "/assets")
    .asUser(creatorId)
    .withContentType("video/shmideo").withData("ABCDE")
    .getJson();
}

function createEmailProfile(userId, email) {
  return makeRequest("POST", "/api/emailprofiles")
    .asRoot()
    .withData({
      userId: userId,
      email: email
    })
    .getJson();
}

function modifyProfile(userId, name, assetId) {
  return makeRequest("POST", "/api/profile")
    .asUser(userId)
    .withData({
      assetId: assetId,
      name: name
    })
    .getJson();
}

function createUserProfile(name, level) {
  var theUser;
  return createUser(name, level)
  .then(function(user) {
    theUser = user;
    return createAsset(user.id);
  })
  .then(function(asset) {
    return modifyProfile(theUser.id, name, asset.id);
  })
}

function fetchActionList(userId) {
  return makeRequest("GET", "/a").asUser(userId).getJson();
}

function deleteAllReminders() {
  return makeRequest("DELETE", "/api/reminders").asRoot().getJson();
}

module.exports = {
  describe: function(title, describer) {
    describe(title, function() {
      describer({
        uid: uid,
        makeRequest: makeRequest,
        createUser: createUser,
        createAsset: createAsset,
        createEmailProfile: createEmailProfile,
        createUserProfile: createUserProfile,
        fetchActionList: fetchActionList,
        deleteAllReminders: deleteAllReminders
      });
    });
  }
}
