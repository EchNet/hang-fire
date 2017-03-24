// Activity.js - base component class for all types of activity.
// All activity views have a header containing an icon, a title, and a cancel/exit link.

define([ "jquery", "ui/index", "services" ],
function($,        ui,         Services) {

  return ui.Component.defineClass(function(c) {

    c.defineDefaultOptions({
      exitLinkText: "Close",
      actionItem: {}
    });

    c.defineInitializer(function() {
      var self = this;
      self.titleLabel = new ui.Component({ cssClass: "title" });
      self.actionItem = self.options.actionItem;
      var exitButton = ui.Button.create(self.options.exitLinkText, function() {
        self.exit();
      });
      self.ele
        .addClass("activity")
        .append($("<div>")
          .addClass("header")
          .append($("<div>").addClass("icon").append($("<img>").attr("src", self.options.actionItem.iconUrl)))
          .append(self.titleLabel.ele)
          .append($("<div>").addClass("cancel")
            .append(exitButton.ele)
          )
        );
      self.ele.on("keyup", function(event) {
        var keyCode = event.originalEvent.keyCode;
        if (keyCode == 27) {
          self.exit();
        }
      });
    });

    c.defineProperty("actionItem", {
      get: function() {
        return this._actionItem.raw;
      },
      set: function(value) {
        this._actionItem = value;
        this.refreshTitle();
      }
    });

    c.defineProperty("title", {
      set: function(value) {
        this.titleLabel.ele.html(value);
      }
    });

    c.extendPrototype({
      openOther: function(actionItem) {
        this.invokePlugin("openOther", actionItem);
      },

      refreshTitle: function() {
        this.title = this._actionItem.title;
      },

      saveForm: function(data) {
        var actionItem = this.options.actionItem;
        return Services.apiService.saveForm(actionItem.topic, actionItem.aspect, data)
        .then(function() {
          Services.sessionManager.refreshNow();
        });
      },

      exit: function() {
        this.invokePlugin("exit");
      }
    });
  });
});
