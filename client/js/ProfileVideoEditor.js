// ProfileVideoEditor.js - profile video editor, a component of the profile editor.

define([ "jquery", "services", "Activity", "ui/index", "VideoRecorder" ],
function($,        Services,   Activity,   ui,         VideoRecorder) {

  var sessionManager = Services.sessionManager;

  function getUser() {
    if (!sessionManager.user) {
      sessionManager.user = {};
    }
    return sessionManager.user;
  }

  function getUserName() {
    return getUser().name || "";
  }

  function setUserName(userName) {
    getUser().name = userName;
  }

  function getUserId() {
    return getUser().id;
  }

  function getAssetUrl() {
    var user = getUser();
    return user && user.asset && user.asset.url;
  }

  return Activity.defineClass(function(c) {

    function initVideoRecorder(self) {
      self.videoRecorder = new VideoRecorder("<div>", {
        what: "profile video",
        acceptButtonLabel: "Save it"
      }).addPlugin(self);
    }

    c.defineInitializer(function() {
      var self = this;
      initVideoRecorder(self);
      self.ele.append(self.videoRecorder.ele);
    });

    c.extendPrototype({
      open: function() {
        this.videoRecorder.open(getAssetUrl());
        return this;
      },
      close: function() {
        this.videoRecorder.close();
        return this;
      },
      saveMessage: function(assetId) {
        return Services.apiService.updateProfile(assetId);
      },
      exit: function() {
        this.invokePlugin("exit");
      }
    });
  });
});
