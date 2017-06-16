// video.js - Video component.
// Sourced by either string (URL) or stream.
// Has custom controls.

define([ "jquery", "ui/button", "ui/component", "ui/sizegoal" ], function($, Button, Component, SizeGoal) {

  var resizer = new SizeGoal({ componentProperty: "$videoElement" });

  return Component.defineClass(function(c) {

    c.defineDefaultOptions({
      cssClass: "video",
      initialWidth: null,
      initialHeight: null,
      useCustomControls: true,
      useOriginalSize: false,
      showFullScreenButton: false
    });

    function setSize($ele, width, height) {
      $ele.css("width", width);
      $ele.css("height", height);
    }

    function initControls(self) {

      function playOrPause() {
        var video = self.videoElement;
        video.paused ? video.play() : video.pause();
      }

      function fullScreen() {
        var video = self.videoElement;
        //options based on browser
        if(video.requestFullScreen) {
          video.requestFullScreen;
        } else if(video.mozRequestFullScreen) {
          video.mozRequestFullScreen();
        } else if(video.webkitRequestFullScreen) {
          video.webkitRequestFullScreen();
        }
      }

      function showPlaying() {
        self.playOverlay.visible = false;
      }

      function showPaused() {
        self.playOverlay.visible = true;
      }

      function showProgress() {
        var video = self.videoElement;
        var currentTime = video.currentTime || 0;
        var duration = isFinite(video.duration) ? video.duration : 10;
        var percentage = Math.min(100, Math.floor((100 / duration) * currentTime));
        self.progressBar.ele.val(percentage);

        if ((currentTime >= 2 || percentage >= 100) && !self.viewNotified) {
          self.viewNotified = true;
          self.invokePlugin("notifyView");
        }
      }

      function restart() {
        var video = self.videoElement;
        video.currentTime = 0;
        if (video.paused) {
          video.play();
        }
        showProgress();
      }

      function postMortem() {
        self.videoElement.currentTime = 0;
        showProgress();
      }

      self.playOverlay = new Component("<div class='overlay'>").addPlugin({
        onClick: playOrPause
      });
      self.restartButton = new Button({ cssClass: "restart" }).addPlugin({
        onClick: restart
      });
      self.progressBar = new Component("<progress min='0' max='100' value='0'>");
      self.fullScreenButton = new Button({ cssClass: "fullScreen" }).addPlugin({
        onClick: fullScreen
      });

      // jQuery is unable to handle creation of video elements.
      self.ele.html("<video></video>");
      var video = self.videoElement;
      video.addEventListener("click", playOrPause);
      video.addEventListener("playing", showPlaying);
      video.addEventListener("pause", showPaused);
      video.addEventListener("ended", postMortem);
      video.addEventListener("timeupdate", showProgress);

      self.controls = new Component("<div class='controls'>");
      self.controls.ele
        .append(self.restartButton.ele)
        .append(self.progressBar.ele)

      if (self.options.showFullScreenButton) {
        self.controls.ele.append(self.fullScreenButton.ele)
      }
    }

    // The outer element is usually a div.  The div contains two elements: the video and a container
    // for controls.
    c.defineInitializer(function() {
      var self = this;
      initControls(self);
      self.ele.append(self.playOverlay.ele);
      if (self.options.useCustomControls) {
        self.ele.append(self.controls.ele);
      }
      else {
        self.videoElement.controls = true;
      }
      if (self.options.initialWidth != null && self.options.initialHeight != null) {
        setSize(self.$videoElement, self.options.initialWidth, self.options.initialHeight);
      }
    });

    c.extendPrototype({
      load: function(src, options) {
        var self = this;
        options = options || {};
        var promise = $.Deferred();
        var theVideo = self.videoElement;
        var srcIsUrl = typeof src == "string";
        if (srcIsUrl && options.initialWidth != null && options.initialHeight != null) {
          setSize(self.$videoElement, options.initialWidth, options.initialHeight);
        }
        var autoplay = options.autoplay || (!!src && !srcIsUrl);
        self.controls.visible = false;
        self.playOverlay.visible = false;

        theVideo.onloadedmetadata = function() {
          if (srcIsUrl) {
            if (options.useOriginalSize) {
              // Set the width of the container to match the intrinsic width of the video.
              resizer.addGoal(self, theVideo.videoWidth, theVideo.videoHeight).then(function() {
                self.ele.css("width", theVideo.videoWidth);
              });
            }
            self.controls.visible = true;
            self.playOverlay.visible = autoplay;
          }
          else {
            self.ele.css("width", theVideo.videoWidth);
            setSize(self.$videoElement, theVideo.videoWidth, theVideo.videoHeight);
          }
          promise.resolve(theVideo);
        }
        theVideo.onerror = function(err) {
          promise.reject(err);
        }

        theVideo.src = srcIsUrl ? src : "";
        theVideo.srcObject = srcIsUrl ? null : src;
        theVideo.autoplay = autoplay;
        theVideo.muted = !srcIsUrl;
        if (src == null) {
          promise.resolve(theVideo);
        }
        return promise;
      },

      clear: function() {
        return this.load(null);
      },

      pause: function() {
        this.videoElement.pause();
        return this;
      }
    });

    c.defineProperty("videoElement", {
      get: function() {
        return this.ele[0].children[0];
      }
    });

    c.defineProperty("$videoElement", {
      get: function() {
        return $(this.videoElement);
      }
    });
  });
});
