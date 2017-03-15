// ConnectionViewer.js - Component for recording and viewing messages to/from a connection.

define([ "jquery", "Activity", "ui/index", "ActionItem", "services" ],
function($,        Activity,     ui,       ActionItem,   Services) {

  var Button = ui.Button;
  var VideoPlayer = ui.Video;

  return Activity.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      var videoPlayer = new VideoPlayer(); 

      self.container
        .append($("<div>").addClass("body")
          .addClass("panel")
          .append(videoPlayer.container)
          .append($("<div>").addClass("formsect").addClass("buttons")))

      self.videoPlayer = videoPlayer;
    });

    function addButton(self, label, onClick) {
      var button = Button.create(label, onClick);
      button.container.appendTo(self.container.find(".buttons"));
    }

    function addSenderButtons(self, fromUser) {
      addButton(self, "Reply to " + fromUser.name, function() {
        self.openOther(new ActionItem({ id: "gre-cre", user: fromUser, isReply: 1 }));
      });
    }

    c.extendPrototype({
      open: function(actionItem) {
        var self = this;
        var actionItem = self.actionItem;

        var asset = actionItem.message ? actionItem.message.asset : actionItem.user.asset;
        self.videoPlayer.load(asset.url, { autoplay: true });

        var sender = actionItem.user || actionItem.message.fromUser;
        if (sender) {
          addSenderButtons(self, sender);
        }

        return self;
      }
    });
  });
});
