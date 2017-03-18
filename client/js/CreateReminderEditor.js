// CreateReminderEditor.js

define([ "jquery", "Activity", "VideoRecorder", "ui/index" ],
function($,        Activity,   VideoRecorder,   ui) {

  var ScheduleEditor = ui.Component.defineClass(function(c) {

    function makeErrorLabel(text) {
      return new ui.Component("<span>", { cssClass: "error" }).setText(text).setVisible(false);
    }

    c.defineProperty("deliverAt", {
      get: function() {
        return "";
      }
    });

    c.defineProperty("timeZone", {
      get: function() {
        return "";
      }
    });

    c.defineProperty("repeatHow", {
      get: function() {
        return "";
      }
    });

    c.defineInitializer(function() {
      var self = this;

      self.okButton = ui.Button.create("Record a message", function() {
        self.invokePlugin("openVideoRecorder");
      });

      self.ele
        .append($("<div>").addClass("panel")
          .append($("<div>")
            .text("Schedule a message to be delivered."))
          .append($("<div class='subtle'>")
            .text("(put editor components here)"))
          .append($("<div>")
            .append(self.okButton.ele))
        )
    });

    c.extendPrototype({
      open: function() {
        return this;
      }
    });
  });

  return Activity.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      self.scheduleEditor = new ScheduleEditor().addPlugin(self);
      self.ele.append(self.scheduleEditor.ele)
    });

    function openVideoRecorder(self) {
      var scheduleEditor = self.scheduleEditor;
      scheduleEditor.visible = false;
      scheduleEditor.close();

      self.videoRecorder = new VideoRecorder("<div>", {
        what: "reminder"
      }).addPlugin(self).open();
      self.ele.append(self.videoRecorder.ele)
    }

    c.extendPrototype({
      open: function() {
        this.nameAndEmailEditor.open();
        return this;
      },
      openVideoRecorder: function() {
        return openVideoRecorder(this);
      },
      saveMessage: function(assetId) {
        return this.saveForm($.extend({}, this.data, {
          assetId: assetId,
          deliverAt: this.scheduleEditor.deliverAt,
          timeZone: this.scheduleEditor.timeZone
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
