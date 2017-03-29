// VideoRecorder.js - Video recorder component.

define([ "jquery", "services", "ui/index", "waitanim" ],
function($,        Services,   ui,         WaitAnim) {

  var videoService = Services.videoService;

  // Component states.

  var STATE_WAITING = "waiting";     // Waiting for I/O.
  var STATE_READY = "ready";         // Camera is on but not recording.  There is no saved video.
  var STATE_RECORDING = "recording"; // Camera is on and recording.
  var STATE_REVIEW = "review";       // Playing back a video that was just recorded and not yet saved.
  var STATE_PREVIEW = "preview";     // Playing back a previously saved video.
  var STATE_ERROR = "error";         // Something went wrong.
  var STATE_DONE = "done";           // Success.

  function now() {
    return new Date().getTime();
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  }

  var ControlPanel = ui.Carton.defineClass(function(c) {

    c.defineDefaultOptions({
      initialState: STATE_WAITING,
      acceptButtonLabel: "Send it"
    });

    c.defineInitializer(function() {
      var self = this;
      var what = self.options.what;

      self.defaultButtons = {};
      function declareDefaultButtonForState(state, button) {
        button.ele.addClass("default");
        self.defaultButtons[state] = button;
      }

      // [Click here] to start recording
      var startButton = ui.Button.create("Click here", function() {
        self.invokePlugin("startRecording");
      });
      declareDefaultButtonForState(STATE_READY, startButton);

      // Recording... [Stop]
      var stopButton = ui.Button.create("Stop", function() {
        self.invokePlugin("stopRecording");
      });
      declareDefaultButtonForState(STATE_RECORDING, stopButton);

      // Review your XXX...  [Send it] or [Re-record it]
      var acceptButton = ui.Button.create(self.options.acceptButtonLabel, function() {
        self.invokePlugin("acceptRecording");
      });
      declareDefaultButtonForState(STATE_REVIEW, acceptButton);
      var rejectButton = ui.Button.create("Re-record it", function() {
        self.invokePlugin("rejectRecording");
      });

      // Here is your previously recorded... [Re-record it]
      var redoButton = ui.Button.create("Re-record it", function() {
        self.invokePlugin("rejectRecording");
      });

      // Your XXX has been sent. [OK]
      var closeButton = ui.Button.create("OK", function() {
        self.invokePlugin("exit");
      });
      declareDefaultButtonForState(STATE_DONE, closeButton);

      // Oh no, something went wrong. [Try again]
      var retryButton = ui.Button.create("Try again", function() {
        self.invokePlugin("retry");
      });
      declareDefaultButtonForState(STATE_ERROR, retryButton);

      self.addCompartment(STATE_WAITING, new WaitAnim());
      self.addCompartment(STATE_READY, new ui.Component()
        .append(startButton)
        .append(new ui.Component("<span>").setText(" to start recording your " + what + "."))
      );
      self.addCompartment(STATE_RECORDING, new ui.Component()
        .append(new ui.Component("<span>").setText("Recording... "))
        .append(stopButton)
      );
      self.addCompartment(STATE_REVIEW, new ui.Component()
        .append(new ui.Component("<span>").setText("Please review your " + what + "... "))
        .append(acceptButton)
        .append(rejectButton)
      );
      self.addCompartment(STATE_PREVIEW, new ui.Component()
        .append(new ui.Component("<span>").setText("Here is your previously recorded " + what + "... "))
        .append(redoButton)
      );
      self.addCompartment(STATE_ERROR, new ui.Component()
        .append(new ui.Component("<span>").setText("Oh no, something went wrong! "))
        .append(retryButton)
      );
      self.addCompartment(STATE_DONE, new ui.Component()
        .append(new ui.Component("<span>").setText(capitalize(what) + " sent! "))
        .append(closeButton)
      );
    });
  });

  function createController(self) {

    var controller;

    function showState(state) {
      self.controlPanel.show(state);
      var defaultButton = self.controlPanel.defaultButtons[state];
      if (defaultButton) {
        setTimeout(function() {
          defaultButton.focus();
        }, 100);
      }
    }

    function runTransition() {
      // TODO: add timeout.
      self.transitionFunc()
      .then(function() {
        showState(self.targetState);
      })
      .catch(function(err) {
        console.log(err);
        showState(STATE_ERROR);
      });
    }

    function toNextState(transitionFunc, targetState) {
      self.transitionFunc = transitionFunc;
      self.targetState = targetState;
      runTransition();
    }

    function openCamera() {
      self.videoBlob = null;
      return videoService.open()
      .then(function(stream) {
        return self.videoComponent.load(stream);
      });
    }

    function startCountdown() {
      self.counter.text = "Recording";
      self.counter.visible = true;
      (function scheduleCountdown() {
        self.countdownTimeout = setTimeout(function() {
          var millisRemaining = self.autoStopTime - now();
          if (millisRemaining <= 0) {
            controller.stopRecording();
          }
          else {
            var secondsRemaining = Math.floor(millisRemaining/1000 + 1);
            var t = 1000 - (millisRemaining % 1000);
            var opacity = Math.max(0, Math.cos(t * Math.PI/2 / 700));
            if (secondsRemaining <= self.options.countdownStartsAt) {
              self.counter.text = secondsRemaining;
            }
            self.counter.container.css("opacity", opacity);
            scheduleCountdown();
          }
        }, 50);
      })();
    }

    function cancelCountdown() {
      clearTimeout(self.countdownTimeout);
      self.counter.visible = false;
    }

    function showUrl() {
      return self.videoComponent.load(self.url);
    }

    function showRecording() {
      var promise = $.Deferred();
      self.videoComponent.pause();
      clearTimeout(self.countdownTimeout);
      self.counter.visible = false;
      videoService.stopRecording(function(blob, url) {
        self.videoBlob = blob;
        self.url = url;
        videoService.close();
        promise.resolve(showUrl());
      });
      return promise;
    }

    function saveRecording() {
      self.videoComponent.pause();
      var videoBlob = self.videoBlob;
      self.videoBlob = null;
      return Services.apiService.saveVideo(videoBlob)
      .then(function(asset) {
        return self.videoComponent.load(asset.url)
        .then(function() {
          return self.invokePlugin("saveMessage", asset.id);
        });
      })
    }

    controller = {

      open: function(url) {
        if (url) {
          self.url = url;
          toNextState(showUrl, STATE_PREVIEW);
        }
        else {
          toNextState(openCamera, STATE_READY);
        }
      },

      startRecording: function() {
        videoService.startRecording();
        showState(STATE_RECORDING);
        self.autoStopTime = now() + (self.options.maxSeconds * 1000);
        startCountdown();
      },

      stopRecording: function() {
        cancelCountdown();
        toNextState(showRecording, STATE_REVIEW);
      },

      acceptRecording: function() {
        toNextState(saveRecording, STATE_DONE);
      },

      rejectRecording: function() {
        toNextState(openCamera, STATE_READY);
      },

      retry: function() {
        if (self.transitionFunc) {
          runTransition();
        }
      }
    }
    return controller;
  }

  var VideoRecorder = ui.Component.defineClass(function(c) {

    c.defineDefaultOptions({
      what: "videogram",
      maxSeconds: 20,
      countdownStartsAt: 5
    });

    c.defineInitializer(function() {
      var self = this;
      var controller = createController(self);
      var controlPanel = new ControlPanel($.extend({}, self.options, {
        cssClasses: [ "controlPanel", "panel" ]
      }))
        .addPlugin(controller)
        .addPlugin(self);
      var videoComponent = new ui.Video();
      var counter = new ui.Component({ html: "<span>", cssClass: "counter" });

      self.ele
        .append(controlPanel.ele)
        .append($("<div>")
          .addClass("vidrec")
          .addClass("panel")
          .append(videoComponent.ele)
        )

      videoComponent.ele.append(counter.ele);

      self.controlPanel = controlPanel;
      self.videoComponent = videoComponent;
      self.counter = counter;
      self.controller = controller;
    });

    c.extendPrototype({

      open: function(url) {
        this.controller.open(url);
        return this;
      },

      close: function() {
        videoService.close();
        return this;
      },

      addControl: function(state, control) {
        this.controlPanel.compartments[state].ele.append(control.ele);
        return this;
      },

      exit: function() {
        return this.invokePlugin("exit");
      }
    });
  });

  $.extend(VideoRecorder, { 
    STATE_READY: STATE_READY,
    STATE_RECORDING: STATE_RECORDING,
    STATE_REVIEW: STATE_REVIEW,
    STATE_PREVIEW: STATE_PREVIEW,
    STATE_ERROR: STATE_ERROR,
    STATE_DONE: STATE_DONE
  });

  return VideoRecorder;
});
