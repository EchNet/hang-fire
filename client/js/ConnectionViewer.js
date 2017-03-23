// ConnectionViewer.js - Component for recording and viewing messages to/from a connection.

define([ "jquery", "Activity", "ui/index", "ActionItem", "Services", "VideoRecorder", "util/When" ],
function($,        Activity,     ui,       ActionItem,   Services,   VideoRecorder, When ) {

  return Activity.defineClass(function(c) {

    function addControls(self) {

      function messageDescription(message) {
        return (message.fromUserId == self.actionItem.user.id ? self.actionItem.user.name : "you")
          + " at " + When.formatRelativeTime(Date.parse(message.createdAt));
      }

      function addThumb(self, url, onClick) {
        new ui.Image("<div class='thumb'>").setSrc(url).addPlugin({
          onClick: onClick
        }).ele.appendTo(self.buttonPanel.ele);
      }

      function toPlayState(index, autoplay) {
        self.ele.find(".thumb.selected").removeClass("selected");
        if (self.actionItem.thread && self.actionItem.thread.length > index) {
          var message = self.actionItem.thread[index];
          autoplay = autoplay || message.fromUserId == self.actionItem.user.id;
          self.videoPlayer.load(message.asset.url, { autoplay: autoplay });
          self.videoDesc.text = messageDescription(message);
          self.playerView.visible = true;
          self.ele.find(".thumb:eq(" + (index + 1) + ")").addClass("selected");
        }
        self.videoRecorder.close();
        self.videoRecorder.visible = false;
      }

      function toReplyState() {
        var userName = self.actionItem.user.name || "your connection";
        self.title = $("<span>").text("Send videogram to ").append($("<span class='hilite'>").text(userName));
        self.playerView.visible = false;
        self.videoRecorder.visible = true;
        self.videoRecorder.open();
      }

      addThumb(self, "/img/plus.png", toReplyState);

      for (var i = 0; i < self.actionItem.thread.length; ++i) {
        (function(i) {
          var message = self.actionItem.thread[i];
          addThumb(self, message.asset.thumbnailUrl, function() {
            toPlayState(i, true);
          });
        })(i);
      }

      self.toPlayState = toPlayState;
    }

    c.defineInitializer(function() {
      var self = this;
      self.videoPlayer = new ui.Video(); 
      self.buttonPanel = new ui.Component("<div style='float: left;'>");
      self.videoDesc = new ui.Component("<div class='subtle'>");
      self.playerView = new ui.Component("<div class='panel'>").setVisible(false);
      self.videoRecorder = new VideoRecorder().addPlugin(self).setVisible(false);

      self.playerView.ele
        .append(self.videoDesc.ele)
        .append(self.buttonPanel.ele)
        .append(self.videoPlayer.ele.css({ "margin": "auto" }))

      self.ele
        .append($("<div>").addClass("body")
          .append(self.playerView.ele)
          .append(self.videoRecorder.ele)
        )

      addControls(self);
    });

    c.extendPrototype({
      open: function() {
        this.toPlayState(0);
        return this;
      },
      saveMessage: function(assetId) {
        return this.saveForm({ toUserId: this.actionItem.user.id, assetId: assetId });
      },
    });
  });
});
