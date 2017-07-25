// video.js - Video component.
// Sourced by either string (URL) or stream.
// Has custom controls.

define([ "jquery", "ui/button", "ui/component" ], function($, Button, Component) {

  return Component.defineClass(function(c) {

    // The root element is a div.  There are the following children:
    // - The video element itself,
    // - An optional div for controls,
    // - An overlay container shown when the video is paused.
    // an optional div for controls.  All sizing operations offered by this component 
    // pertain to the root div, not to the video.  The video should be given (via CSS)
    // width 100% or height 100%, so that it follows the size of the root div and maintains
    // aspect ratio.  The controls div should be positioned so that it does not interfere 
    // with the sizing of the video.  The overlay must be styled appropriately.

    c.defineDefaultOptions({
      cssClass: "video",
      controlsCssClass: "controls",
      useOriginalWidth: false,     // if true, when video is loaded, set the container width
                                   // to the width of the vide.
      useOriginalHeight: false,    // if true, when video is loaded, set the container height
                                   // to the height of the vide.
      showRestartButton: false,
      showProgressBar: false,
      showFullScreenButton: false,
      autoplay: false             // play on load
    });

    function init(self) {

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
        self.overlay.visible = false;
        self.invokePlugin("playbackStart", self.videoElement);
      }

      function showPaused() {
        self.overlay.visible = true;
        self.invokePlugin("playbackStop", self.videoElement);
      }

      function showProgress() {
        var video = self.videoElement;
        var currentTime = video.currentTime || 0;
        var duration = isFinite(video.duration) ? video.duration : 10;
        var percentage = Math.min(100, Math.floor((100 / duration) * currentTime));
        if (self.progressBar) {
          self.progressBar.ele.val(percentage);
        }

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

      // jQuery is unable to handle creation of video elements.
      self.ele.html("<video></video>");
      var video = self.videoElement;
      video.addEventListener("click", playOrPause);
      video.addEventListener("playing", showPlaying);
      video.addEventListener("pause", showPaused);
      video.addEventListener("ended", postMortem);
      video.addEventListener("timeupdate", showProgress);

      self.controls = new Component("<div>", { cssClass: self.options.controlsCssClass });

      function addControl(control) {
        self.controls.ele.append(control.ele)
      }

      if (self.options.showRestartButton) {
        var restartButton = new Button({ cssClass: "restart" }).addPlugin({
          onClick: restart
        });
        addControl(restartButton);
      }

      if (self.options.showProgressBar) {
        self.progressBar = new Component("<progress min='0' max='100' value='0'>");
        addControl(self.progressBar);
      }

      if (self.options.showFullScreenButton) {
        var fullScreenButton = new Button({ cssClass: "fullScreen" }).addPlugin({
          onClick: fullScreen
        });
        addControl(fullScreenButton)
      }

      if (!self.controls) {  // Some random behavior: if no custom controls specified, use built-in controls.
        self.videoElement.controls = true;
      }

      self.overlay = new Component("<div class='overlay'>").addPlugin({
        onClick: playOrPause
      }).setVisible(false);
      self.ele.append(self.overlay.ele);

      self.restart = restart;
    }

    c.defineInitializer(function() {
      init(this);
    });

    c.extendPrototype({
      load: function(src) {
        var self = this;
        var promise = $.Deferred();
        var theVideo = self.videoElement;
        var srcIsUrl = typeof src == "string";
        var autoplay = self.options.autoplay || (!!src && !srcIsUrl);
        self.controls.visible = false;
        self.overlay.visible = false;

        theVideo.onloadedmetadata = function() {
          if (self.options.useOriginalWidth) {
            // Set the width of the container to match the intrinsic width of the video.
            self.ele.css("width", theVideo.videoWidth);
          }
          if (self.options.useOriginalHeight) {
            // Set the height of the container to match the intrinsic height of the video.
            self.ele.css("height", theVideo.videoHeight);
          }
          if (srcIsUrl && self.controls) {
            self.controls.visible = true;
          }
          self.overlay.visible = !autoplay;
          promise.resolve(theVideo);
          self.invokePlugin("videoLoaded", theVideo);
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
      },

      replay: function() {
        this.restart();
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
