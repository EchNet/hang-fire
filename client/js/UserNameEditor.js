// UserNameEditor.js - user name editor, a component of the profile editor.

define([ "jquery", "services", "Activity", "Asset", "ActionItem", "ui/index", "waitanim", "ProfileVideoEditor" ],
function($,        Services,   Activity,   Asset,   ActionItem,   ui,         WaitAnim,   ProfileVideoEditor) {

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

  return Activity.defineClass(function(c) {

    function initController(self) {

      function block() {
        self.nameInput.enabled = false;
        self.updateButton.enabled = false;
        self.waitAnim.open();
        self.waitAnim.visible = true;
        self.updatedMsg.visible = false;
      }

      function unblock() {
        self.nameInput.enabled = true;
        self.updateButton.enabled = self.nameInput.valid && self.nameInput.value != getUserName();
        self.waitAnim.close();
        self.waitAnim.visible = false;
        self.updatedMsg.visible = false;
      }

      function submit() {
        if (self.updateButton.enabled) {
          block();
          Services.apiService.updateUser(getUserId(), getUserName())
          .then(function() {
            unblock();
            self.updatedMsg.visible = true;
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
        }).setLabel("Update").setEnabled(false);
      }

      function createOpenProfileVideoEditorButton() {
        return new ui.Button().addPlugin({
          onClick: function() {
            var asset = getUser().asset;
            self.openOther(new ActionItem({
              id: "pro-" + (asset ? "upd" : "cre"),
              asset: asset
            }));
          }
        }).setLabel("Click here");
      }

      self.nameInput = createNameInput();
      self.updateButton = createUpdateButton();
      self.openProfileVideoEditorButton = createOpenProfileVideoEditorButton();
      self.waitAnim = new WaitAnim($("<span>"), { ndots: 3 }).setVisible(false);
      self.updatedMsg = new ui.Component("<span class='subtle'>").setText("User name updated").setVisible(false);

      self._open = function() {
        self.nameInput.value = getUserName();
        unblock();
        setTimeout(function() {
          self.nameInput.select().focus();
        }, 100);
      }
    }

    function appendUserNamePanel(self) {
      self.ele
        .append($("<div class='panel'>")
          .append($("<div>")
            .text("Your user name is shown to the other Living Connections users " +
                  "you connect with and appears in the invitations that you send."))
          .append($("<div>")
            .append($("<span>").text("Your user name is: ")
            .append(self.nameInput.ele)
            .append(self.updateButton.ele)
            .append($("<div>")
              .append(self.waitAnim.ele)
              .append(self.updatedMsg.ele))
              )))
    }

    function appendVideoPreview(self) {
      var user = getUser();
      var asset = user.asset && new Asset(user.asset);
      var panel = $("<div class='panel'>");
      panel.append($("<div>")
        .text("You may also introduce yourself to other users by recording a profile video. " +
              "Your profile video is shown to other members you invite or connect with. " +
              "We also select a frame from the video to use as your profile picture."));
      if (asset) {
        panel
          .append($("<div>").text("Here is your current profile picture:"))
          .append($("<div class='thumb'>").append(new ui.Image().setSrc(asset.thumbnailUrl).ele));
      }
      else {
        panel.append($("<div>")
          .text("If you have not done so already, you will have to allow Living Connections " +
                "to use your computer's camera and microphone by clicking a button that pops " +
                "up in your brower."));
      }
      panel.append($("<div>")
        .append(self.openProfileVideoEditorButton.ele)
        .append($("<span>").text("to record a " + (asset ? "new " : "") + "profile video.")));
      self.ele.append(panel);
    }

    c.defineInitializer(function() {
      var self = this;
      initController(self);
      appendUserNamePanel(self);
      appendVideoPreview(self);
    });

    c.extendPrototype({
      open: function() {
        this._open();
        return this;
      },
      exit: function() {
        this.invokePlugin("exit");
      }
    });
  });
});
