// audio.js - Audio component.
// Sourced by either string (URL) or stream.

define([ "jquery", "ui/component", "ui/observable" ], function($, Component, Observable) {

  return Component.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      self.state = new Observable(0);
      // jQuery is unable to handle creation of audio elements?
      self.ele.html("<audio></audio>");
    });

    c.defineProperty("audioElement", {
      get: function() {
        return this.container[0].children[0];
      }
    });

    c.extendPrototype({
      load: function(src) {
        var self = this;
        var promise = $.Deferred();
        var theAudio = self.audioElement;

        self.state.setValue(0);
        theAudio.onloadedmetadata = function() {
          self.state.setValue(1);
        }
        theAudio.onerror = function() {
          // Event object contains no useful information.
          self.state.setValue(-1);
        }

        if (src != null) {
          var undoer = self.state.addChangeListener(function() {
            if (self.state.value == 1) {
              promise.resolve(self);
            }
            else {
              promise.reject();
            }
            undoer.undo();
          });
        }

        var srcIsUrl = typeof src == "string";
        theAudio.src = srcIsUrl ? src : "";
        theAudio.srcObject = srcIsUrl ? null : src;
        theAudio.preload = srcIsUrl;
        if (src == null) {
          promise.resolve(self);
        }
        return promise;
      },

      play: function() {
        this.audioElement.play();
        return this;
      },

      pause: function() {
        this.audioElement.pause();
        return this;
      }
    });
  });
});
