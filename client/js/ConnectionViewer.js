// ConnectionViewer.js - Component for recording and viewing messages to/from a connection.

define([ "jquery", "Activity", "ui/index", "ActionItem", "Services", "util/When" ],
function($,        Activity,   ui,         ActionItem,   Services,   When ) {

  var resizer = new ui.SizeGoal();

  function logView(message) {
    Services.apiService.logEvent({ type: 'view', messageId: message.id });
  }

  var MessageView = ui.Component.defineClass(function(c) {

    var minimizedWidth = 40;
    var maximizedWidth = 320;

    c.defineInitializer(function() {
      var self = this;
      self.videoPlayer = new ui.Video().addPlugin({
        onClick: function() {
          if (!self.maximized) {
            self.invokePlugin("requestMaximize");
          }
        },
        notifyView: function() {
          logView(self.message);
        }
      });
      self.videoPlayer.ele.css("width", minimizedWidth);
      var descrElement = new ui.Component().addClass("subtle").setText(self.description);
      self.append(self.videoPlayer).append(descrElement);
    });

    c.defineProperty("message", {
      get: function() {
        return this.options.message;
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

    c.defineProperty("user", {
      get: function() {
        return this.options.user;
      }
    });

    c.defineProperty("sender", {
      get: function() {
        if (this.message && this.user) {
          return this.message.fromUserId == this.user.id ? this.user.name : "you";
        }
        return "??";
      }
    });

    c.defineProperty("when", {
      get: function() {
        return this.message ? When.formatRelativeTime(Date.parse(this.message.createdAt)) : "??";
      }
    });

    c.defineProperty("description", {
      get: function() {
        return "From " + this.sender + " " + this.when;
      }
    });

    c.extendPrototype({
      open: function() {
        this.videoPlayer.load(this.videoUrl);
      },
      close: function() {
        this.videoPlayer.clear();
        return this;
      },
      minimize: function() {
        var self = this;
        self.videoPlayer.pause();
        resizer.addGoal(self.videoPlayer, minimizedWidth);
        self.maximized = false;
        return self;
      },
      maximize: function() {
        var self = this;
        self.maximized = true;
        resizer.addGoal(self.videoPlayer, maximizedWidth).then(function() {
          self.videoPlayer.replay();
        });
        return this;
      },
    });
  });

  return Activity.defineClass(function(c) {

    function init(self) {

      var user = self.actionItem.user;
      var userName = user.name || "your connection";
      var thread = self.actionItem.thread;

      function requestMaximize(ix) {
        for (var i = 0; i < self.messageViews.length; ++i) {
          self.messageViews[i][i == ix ? "maximize" : "minimize"]();
        }
      }

      function makeMessageOptions() {
        var button = new ui.Button({ cssClass: "plus" });
        var label = new ui.Component("<span>");
        label.ele
          .append($("<span>").text("Send "))
          .append($("<span class='hilite'>").text(userName))
          .append($("<span>").text(" a videogram"));
        return new ui.Component()
          .addClass("messageOptions")
          .append(button)
          .append(label)
          .addPlugin({ onClick: function() {
            // Open reply activity.
            self.openOther(new ActionItem({ id: "gre-cre", user: user }));
          }});
      }

      self.messageViews = [];
      var panel = new ui.Component().addClass("panel");
      self.append(panel);
      panel.append(makeMessageOptions());

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
          });
          panel.append(messageView);
          self.messageViews.push(messageView);
        })(i);
      }
    }

    c.defineInitializer(function() {
      init(this);
    });

    c.extendPrototype({
      open: function() {
        for (var i = 0 ; i < this.messageViews.length; ++i) {
          this.messageViews[i].open();
        }
        return this;
      },
      close: function() {
        for (var i = 0 ; i < this.messageViews.length; ++i) {
          this.messageViews[i].close();
        }
        return this;
      }
    });
  });
});
