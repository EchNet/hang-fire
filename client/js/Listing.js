// Listing.js - action item list component.

define([ "jquery", "ui/index", "services" ], function($, ui, Services) {

  return ui.Component.defineClass(function(c) {

    function openActionItem(self, actionItem) {
      if (self.isOpen) {
        self.invokePlugin("openActionItem", actionItem);
      }
    }

    function startLaunchTimeout(self, actionItem) {
      self.launchTimeout = setTimeout(function() {
        openActionItem(self, actionItem);
      }, 3000);
    }

    function cancelLaunchTimeout(self) {
      clearTimeout(self.launchTimeout);
    }

    function renderItem(self, actionItem) {
      return $("<div>")
        .addClass("item")
        .append($("<img>")
          .addClass("bigIcon")
          .attr("src", actionItem.iconUrl))
        .append($("<div>")
          .addClass("content")
          .append($("<div>")
            .addClass("title")
            .append(actionItem.title))
          .append($("<div>")
            .addClass("subtitle")
            .append(actionItem.subtitle))
        )
        .click(function() {
          openActionItem(self, actionItem);
        })
    }

    function render(self) {
      var uniqueActionItem;
      cancelLaunchTimeout(self);
      var actionGroups = Services.sessionManager.actionGroups;
      self.ele.empty();
      if (actionGroups) {
        for (var i = 0; i < actionGroups.length; ++i) {
          var actionGroup = actionGroups[i];
          for (var j = 0; j < actionGroup.actions.length; ++j) {
            var actionItem = actionGroup.actions[j];
            uniqueActionItem = uniqueActionItem ? null : actionItem;
            var itemView = renderItem(self, actionItem).appendTo(self.ele);
          }
        }
      }
      if (uniqueActionItem) {
        startLaunchTimeout(self, uniqueActionItem);
      }
    }

    c.defineInitializer(function() {
      var self = this;
      self.container.addClass("listing");
      new ui.Audio().load("audio/chime.wav").then(function(chime) {
        self.container.append(chime.container);
        self.chime = chime;
      });
      render(self);
    });

    c.extendPrototype({
      open: function() {
        var self = this;
        if (!self.isOpen) {
          self.isOpen = true;
          self.closeHandle = Services.sessionManager.addActionListener(function() {
            render(self);
          });
        }
        return this;
      },
      close: function() {
        var self = this;
        cancelLaunchTimeout(self);
        self.isOpen = false;
        if (self.closeHandle) {
          self.closeHandle.undo();
          self.closeHandle = null;
        }
        return self;
      }
    });
  });
});
