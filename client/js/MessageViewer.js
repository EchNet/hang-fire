// MessageViewer.js - Component for viewing a message and linking to follow-up actions. 

define([ "jquery", "Activity", "ui/index", "ActionItem", "Services", "VideoRecorder", "MessageView" ],
function($,        Activity,   ui,         ActionItem,   Services,   VideoRecorder, MessageView ) {

  return Activity.defineClass(function(c) {

    c.defineProperty("message", {
      "get": function() {
        return this.actionItem.invite || this.actionItem.message;
      }
    });

    c.defineProperty("isInvite", {
      get: function() {
        return !!this.actionItem.invite;
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
        return this.message && this.message.fromUser;
      }
    });

    function showButtons(self) {

      var buttons = [];

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

      function acceptInvite() {
        enterWaitState();
        Services.apiService.acceptInvite(self.invite.id)
        .then(exitAndRefresh)
        .catch(handleApiError)
      }

      function reject() {
        buttonsEnabled(false);
        Services.apiService.rejectInvite(self.invite.id)
        .then(andWereOut)
        .catch(function(err) {
          buttonsEnabled(true);
          console.log(err);
        })
      }

      function seeProfile() {
        self.openOther(new ActionItem({ id: "pro-rec", user: fromUser }));
      }

      function toReplyState() {
        var userName = self.sender.name || "your connection";
        self.title = $("<span>").text("Reply to ").append($("<span class='hilite'>").text(userName));
        self.videoPlayer.visible = false;
        self.videoRecorder.setVisible(true).open();
        return self;
      }

      if (sender && sender.name) {
        buttons.push(ui.Button.create("Send a reply", toReplyState));
      }

      if (sender && sender.name && sender.asset) {
        buttons.push(ui.Button.create(
          "See " + sender.name + "'s profile message", seeProfile));
      }

      if (self.isInvite) {
        buttons.push(ui.Button.create(
          "Accept " + fromUser.name + "'s invitation", acceptInvite));
        buttons.push(ui.Button.create("No, thanks", rejectInvite));
      }

      for (var i = 0; i < buttons.length; ++i) {
        buttons[i].ele.appendTo(self.buttonPanel);
      }
    }

    function logView(self) {
      Services.apiService.logEvent({ type: 'view', messageId: self.message.id });
    }

    c.defineInitializer(function() {
      var self = this;
      var videoCallbacks = {
        playbackStart: function() {
          self.buttonPanel.empty();
        },
        playbackEnd: function() {
          showButtons(self);
        },
        notifyView: function() {
          logView(self);
        }
      }

      self.videoRecorder = new VideoRecorder().addPlugin(videoCallbacks).setVisible(false);
      self.videoPlayer = new ui.Video().addPlugin(videoCallbacks).setVisible(false); 
      self.buttonPanel = new ui.Component("<div>", { cssClass: "overlay" });

      self.ele
        .append($("<div>").addClass("message-viewer")
          .append(self.videoPlayer.ele)
          .append(self.videoRecorder.ele)
          .append(self.buttonPanel.ele))
    });

    c.extendPrototype({
      open: function(actionItem) {
        var self = this;
        self.videoPlayer.load(self.videoUrl, { autoplay: true }).then(function() {
          self.videoPlayer.visible = true;
          self.videoRecorder.visible = false;
        });
        return self;
      },
      close: function() {
        this.videoPlayer.clear();   // maybe unnecessary.
        this.videoRecorder.close();
        return this;
      },
      saveMessage: function(assetId) {
        return this.saveForm({ toUserId: this.actionItem.user.id, assetId: assetId });
      },
    });
  });
});
