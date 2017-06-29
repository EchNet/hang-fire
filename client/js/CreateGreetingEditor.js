// CreateGreetingEditor.js - New greeting editor

define([ "jquery", "Activity", "VideoRecorder", "ui/index" ],
function($,        Activity,     VideoRecorder,   ui) {

  return Activity.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      self.videoRecorder = new VideoRecorder().addPlugin(self);
      self.ele.append(self.videoRecorder.ele)
    })

    c.extendPrototype({
      open: function() {
        this.videoRecorder.open();
        return this;
      },
      saveMessage: function(assetId) {
        return this.saveForm($.extend({}, this.data, {
          assetId: assetId,
        }));
      },
      close: function() {
        if (this.videoRecorder) {
          this.videoRecorder.close();
        }
        return this;
      }
    });
  });
});
