// InviteViewer.js - Invitation Viewer component

define([ "jquery", "Activity", "ui/index", "ActionItem", "services" ],
function($,        Activity,     ui,       ActionItem,   Services) {

  var Button = ui.Button;
  var VideoPlayer = ui.Video;

  return Activity.defineClass(function(c) {

    function initButtons(self) {
      var fromUser = self.invite.fromUser || { name: "the other user" };

      function buttonsEnabled(enabled) {
        self.acceptButton.enabled = enabled;
        self.rejectButton.enabled = enabled;
        self.profileButton.enabled = enabled;
      }

      function accept() {
        buttonsEnabled(false);
        Services.apiService.acceptInvite(self.invite.id)
        .then(function() {
          Services.sessionManager.refreshNow();
          self.exit();
        })
        .catch(function(err) {
          buttonsEnabled(true);
          console.log(err);
        })
      }

      function reject() {
        buttonsEnabled(false);
        Services.apiService.rejectInvite(self.invite.id)
        .then(function() {
          Services.sessionManager.refreshNow();
          self.exit();
        })
        .catch(function(err) {
          buttonsEnabled(true);
          console.log(err);
        })
      }

      function seeProfile() {
        self.openOther(new ActionItem({ id: "pro-rec", user: fromUser }));
      }

      self.acceptButton = Button.create("Accept " + fromUser.name + "'s invitation to connect", accept);
      self.rejectButton = Button.create("No, thanks", reject);
      self.profileButton = Button.create("See " + fromUser.name + "'s profile message", seeProfile);

      self.profileButton.visible = !!fromUser.asset;
    }

    c.defineProperty("invite", {
      "get": function() {
        return this.actionItem.invite;
      }
    });

    c.defineInitializer(function() {
      var self = this;

      self.videoPlayer = new VideoPlayer(); 
      initButtons(self);

      self.container
        .append($("<div>").addClass("body")
          .addClass("panel")
          .append(self.videoPlayer.ele)
          .append($("<div>").addClass("buttons")
            .append(self.acceptButton.ele)
            .append(self.rejectButton.ele)
            .append(self.profileButton.ele)));
    });

    c.extendPrototype({
      open: function(actionItem) {
        var self = this;
        self.videoPlayer.load(self.invite.asset.url, { autoplay: true });
        return Activity.prototype.open.call(self);
      }
    });
  });
});
