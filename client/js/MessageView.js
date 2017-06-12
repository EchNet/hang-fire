// MessageView.js - Message view, with minimized and maximized states. 
// Video plays automatically when view is maximized.
// TODO: resize transitions.

define([ "ui/index", "util/When" ],
function(ui,         When ) {

  return ui.Component.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      self.thumb = new ui.Image({ cssClass: "thumb" }).setSrc(self.thumbUrl).addPlugin({
        onClick: function() {
          self.invokePlugin("requestMaximize");
        }
      });
      self.videoPlayer = new ui.Video().setVisible(false); 
      var descrElement = new ui.Component({ cssClass: "subtle" }).setText(self.description);
      self.append(self.thumb).append(self.videoPlayer).append(descrElement);

      var minimize = self.options.minimize;
      self.minimized = minimize;
      self.thumb.visible = minimize;
      self.videoPlayer.visible = !minimize;
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

    c.defineProperty("thumbUrl", {
      get: function() {
        return this.asset && this.asset.thumbnailUrl;
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
        if (!this.minimized) {
          this.videoPlayer.load(this.videoUrl);
        }
      },
      close: function() {
        this.videoPlayer.clear();
        return this;
      },
      minimize: function() {
        if (!this.minimized) {
          this.thumb.visible = true;
          this.videoPlayer.visible = false;
          this.videoPlayer.clear();
          this.minimized = true;
        }
        return this;
      },
      maximize: function(autoplay) {
        if (this.minimized) {
          this.thumb.visible = false;
          this.videoPlayer.load(this.videoUrl, { autoplay: autoplay });
          this.videoPlayer.visible = true;
          this.minimized = false;
        }
        return this;
      }
    });
  });
});
