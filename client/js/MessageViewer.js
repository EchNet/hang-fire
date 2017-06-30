// MessageViewer.js - Component for viewing an incoming message.
// After the video plays, function buttons are shown.

define([ "jquery", "Activity", "ui/index", "ActionItem", "Services" ],
function($,        Activity,   ui,         ActionItem,   Services) {

  return Activity.defineClass(function(c) {

    c.defineProperty("message", {
      get: function() {
        return this.actionItem.message || this.actionItem.invite;
      }
    });

    c.defineProperty("asset", {
      get: function() {
        return this.message && this.message.asset;
      }
    });

    c.defineProperty("videoUrl", {
      get: function() {
        return this.asset && this.asset.url;
      }
    });

    c.defineProperty("sender", {
      get: function() {
        return this.actionItem.user || this.message.fromUser;
      }
    });

    function addButtons(self) {

      if (self.buttonsAdded) return
      self.buttonsAdded = true;

      function buttonsEnabled(enabled) {
        for (var i = 0; i < buttons.length; ++i) {
          buttons[i].enabled = enabled;
        }
      }

      function exitAndRefresh() {
        Services.sessionManager.refreshNow();
        self.exit();
      }

      function handleApiError(err) {
        buttonsEnabled(true);
        console.log(err);
      }

      function seeProfile() {
        self.openOther(new ActionItem({ id: "pro-rec", user: self.sender }));
      }

      function createReply() {
        self.openOther(new ActionItem({ id: "gre-cre", user: self.sender }));
      }

      function acceptInvite() {
        enterWaitState();
        Services.apiService.acceptInvite(self.actionItem.invite.id)
        .then(exitAndRefresh)
        .catch(handleApiError)
      }

      function rejectInvite() {
        buttonsEnabled(false);
        Services.apiService.rejectInvite(self.actionItem.invite.id)
        .then(andWereOut)
        .catch(handleApiError)
      }

      var buttons = [];
      var buttonClasses = [ "topLeft", "topRight", "bottomLeft", "bottomRight" ];

      var sender = self.sender;
      if (sender && sender.name) {
        buttons.push(ui.Button.create("Send a reply", createReply));

        if (sender.asset) {
          buttons.push(ui.Button.create(
            "See " + sender.name + "'s profile message", seeProfile));
        }

        if (self.actionItem.invite) {
          buttons.push(ui.Button.create(
            "Accept " + sender.name + "'s invitation", acceptInvite));
          buttons.push(ui.Button.create("No, thanks", rejectInvite));
        }
      }

      for (var i = 0; i < buttons.length; ++i) {
        buttons[i].ele.addClass(buttonClasses[i]);
        buttons[i].ele.appendTo(self.videoPlayer.overlay.ele);
      }
    }

    function logView(self) {
      if (self.actionItem.message) {
        // TODO: log view of invitation message
        Services.apiService.logEvent({ type: 'view', messageId: self.message.id });
      }
    }

    c.defineInitializer(function() {
      var self = this;
      var videoCallbacks = {
        playbackStart: function() {
        },
        playbackStop: function() {
          addButtons(self);
        },
        notifyView: function() {
          logView(self);
        }
      }

      self.videoPlayer = new ui.Video().addPlugin(videoCallbacks); 
      self.ele.append(self.videoPlayer.ele);
    });

    c.extendPrototype({
      open: function(actionItem) {
        var self = this;
        self.videoPlayer.load(self.videoUrl, { autoplay: true }).then(function() {
          self.videoPlayer.visible = true;
        });
        return self;
      },
      close: function() {
        this.videoPlayer.clear();   // maybe unnecessary.
        return this;
      },
      saveMessage: function(assetId) {
        return this.saveForm({ toUserId: this.actionItem.user.id, assetId: assetId });
      },
    });
  });
});
