// UserNameEditor.js - User Editor component

define([ "jquery", "services", "Activity", "ui/index", "waitanim", "VideoRecorder" ],
function($,        Services,   Activity,   ui,         WaitAnim,   VideoRecorder) {

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

    function initController(self) {

      function block() {
        self.nameInput.enabled = false;
        self.updateButton.enabled = false;
        self.waitAnim.open();
      }

      function unblock() {
        self.nameInput.enabled = true;
        self.updateButton.enabled = self.nameInput.valid && self.nameInput.value != getUserName(); self.waitAnim.close();
      }

      function submit() {
        if (self.updateButton.enabled) {
          block();
          Services.apiService.updateUser(getUserId(), getUserName())
          .then(function() {
            unblock();
            sessionManager.refreshNow();
          })
          .catch(function(err) {
            unblock();
            console.log(err);
          });
        }
      }

      function createNameInput() {
        return new ui.TextInput().addPlugin({
          onChange: function() {
            unblock();
          },
          submit: function(name) {
            setUserName(name);
            submit();
          }
        })
        .setPlaceholder("(not set)");
      }

      function createUpdateButton() {
        return new ui.Button({ cssClass: "default" }).addPlugin({
          onClick: function() {
            self.nameInput.submit();
          }
        }).setLabel("Update");
      }

      self.nameInput = createNameInput();
      self.updateButton = createUpdateButton();
      self.waitAnim = new WaitAnim($("<span>"), { ndots: 3 });

      self._open = function() {
        self.nameInput.value = getUserName();
        unblock();
        setTimeout(function() {
          self.nameInput.select().focus();
        }, 100);
      }
    }

    function initVideoRecorder(self) {
      self.videoRecorder = new VideoRecorder("<div>", {
        what: "profile video",
        acceptButtonLabel: "Save it"
      }).addPlugin(self);
    }

    c.defineInitializer(function() {
      var self = this;
      initController(self);
      initVideoRecorder(self);
      self.ele
        .append($("<div>")
          .addClass("panel")
          .append($("<div>")
            .append($("<span>").text("Your user name is: ")
            .append(self.nameInput.ele)
            .append(self.updateButton.ele))
            .append(self.waitAnim.ele))
          .append($("<div>")
            .text("This is the name that is shown to other Living Connections users " +
                  "and appears in the invitations that you send."))
          .append($("<div>")
            .text("You may also keep a profile video. This is how you appear to other users."))
          )
        .append(self.videoRecorder.ele);
    });

    c.extendPrototype({
      open: function() {
        this._open();
        this.videoRecorder.open(getAssetUrl());
        return this;
      },
      close: function() {
        this.videoRecorder.close();
        return this;
      },
      saveMessage: function(assetId) {
        return this.saveForm({ assetId: assetId });
      },
      exit: function() {
        this.invokePlugin("exit");
      }
    });
  });
});
