// ConnectionViewer.js - Component for recording and viewing messages to/from a connection.

define([ "jquery", "Activity", "ui/index", "ActionItem", "Services", "VideoRecorder", "MessageView" ],
function($,        Activity,     ui,       ActionItem,   Services,   VideoRecorder, MessageView ) {

  return Activity.defineClass(function(c) {

    function addControls(self) {

      var user = self.actionItem.user;
      var thread = self.actionItem.thread;
      var wouldBeReply = thread.length && thread[0].fromUserId == user.id;

      function requestMaximize(ix) {
        for (var i = 0; i < self.messageViews.length; ++i) {
          self.messageViews[i][i == ix ? "maximize" : "minimize"]();
        }
      }

      function toReplyState() {
        var userName = self.actionItem.user.name || "your connection";
        self.title = $("<span>").text(wouldBeReply ? "Reply to " : "Send videogram to ").append($("<span class='hilite'>").text(userName));
        self.playerView.visible = false;
        self.videoRecorder.visible = true;
        self.videoRecorder.open();
        return self;
      }

      function toPlaybackState() {
        self.playerView.visible = true;
        self.videoRecorder.visible = false;
        return self;
      }

      function makeMessageOptions() {
        var labelText = wouldBeReply ? "Reply" : ("Send " + (thread.length ? "another" : "a") + " videogram");
        var label = new ui.Component("<span>").setText(labelText + " ");
        var button = new ui.Button({ cssClass: "plus" });
        return new ui.Component({ cssClass: "messageOptions" })
          .append(label)
          .append(button)
          .addPlugin({ onClick: toReplyState });
      }

      function logView(message) {
        Services.apiService.logEvent({ type: 'view', messageId: message.id });
      }

      self.playerView.append(makeMessageOptions());

      for (var i = 0; i < thread.length; ++i) {
        (function(i) {
          var message = thread[i];
          var messageView = new MessageView({
            minimize: i != 0,
            user: user,
            message: message,
            cssClass: "messageView"
          }).addPlugin({
            requestMaximize: function() {
              requestMaximize(i);
            },
            notifyView: function() {
              logView(message);
            }
          });
          self.playerView.append(messageView);
          self.messageViews.push(messageView);
        })(i);
      }

      self.toReplyState = toReplyState;
      self.toPlaybackState = toPlaybackState;
    }

    c.defineInitializer(function() {
      var self = this;
      self.messageViews = [];
      self.playerView = new ui.Component({ cssClass: "panel" }).setVisible(false);
      self.videoRecorder = new VideoRecorder().addPlugin(self).setVisible(false);

      self.ele
        .append($("<div>").addClass("body")
          .append(self.playerView.ele)
          .append(self.videoRecorder.ele)
        )

      addControls(self);
    });

    c.extendPrototype({
      open: function() {
        for (var i = 0 ; i < this.messageViews.length; ++i) {
          this.messageViews[i].open();
        }
        return this.messageViews.length ? this.toPlaybackState() : this.toReplyState();
      },
      close: function() {
        for (var i = 0 ; i < this.messageViews.length; ++i) {
          this.messageViews[i].close();
        }
        return this;
      },
      saveMessage: function(assetId) {
        return this.saveForm({ toUserId: this.actionItem.user.id, assetId: assetId });
      },
    });
  });
});
