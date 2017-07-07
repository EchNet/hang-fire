// CreateReminderEditor.js

define([ "jquery", "Activity", "VideoRecorder", "ui/index" ],
function($,        Activity,   VideoRecorder,   ui) {

  var ScheduleEditor = ui.Component.defineClass(function(c) {

    function makeErrorLabel(text) {
      return new ui.Component({ html: "<span>", cssClass: "error" }).setText(text).setVisible(false);
    }

    c.defineProperty("deliverAt", {
      get: function() {
        return this.deliverAtSelector.value;
      }
    });

    c.defineProperty("repeatHow", {
      get: function() {
        return this.repeatBox.value ? 1 : 0;
      }
    });

    c.defineInitializer(function() {
      var self = this;

      self.deliverAtSelector = new ui.DropDown({
        options: [
          { label: "5:00 AM", value: "0500" },
          { label: "5:30 AM", value: "0530" },
          { label: "6:00 AM", value: "0600" },
          { label: "6:30 AM", value: "0630" },
          { label: "7:00 AM", value: "0700" },
          { label: "7:30 AM", value: "0730" },
          { label: "8:00 AM", value: "0800" },
          { label: "8:30 AM", value: "0830" },
          { label: "9:00 AM", value: "0900" },
          { label: "9:30 AM", value: "0930" },
          { label: "10:00 AM", value: "1000" },
          { label: "10:30 AM", value: "1030" },
          { label: "11:00 AM", value: "1100" },
          { label: "11:30 AM", value: "1130" },
          { label: "12:00 PM", value: "1200", selected: 1 },
          { label: "12:30 PM", value: "1230" },
          { label: "1:00 PM", value: "1300" },
          { label: "1:30 PM", value: "1330" },
          { label: "2:00 PM", value: "1400" },
          { label: "2:30 PM", value: "1430" },
          { label: "3:00 PM", value: "1500" },
          { label: "3:30 PM", value: "1530" },
          { label: "4:00 PM", value: "1600" },
          { label: "4:30 PM", value: "1630" },
          { label: "5:00 PM", value: "1700" },
          { label: "5:30 PM", value: "1730" },
          { label: "6:00 PM", value: "1800" },
          { label: "6:30 PM", value: "1830" },
          { label: "7:00 PM", value: "1900" },
          { label: "7:30 PM", value: "1930" },
          { label: "8:00 PM", value: "2000" },
          { label: "8:30 PM", value: "2030" },
          { label: "9:00 PM", value: "2100" },
          { label: "9:30 PM", value: "2130" },
          { label: "10:00 PM", value: "2200" },
          { label: "10:30 PM", value: "2230" },
          { label: "11:00 PM", value: "2300" },
          { label: "11:30 PM", value: "2300" },
          { label: "12:00 AM", value: "0000" },
          { label: "12:30 AM", value: "0030" },
          { label: "1:00 AM", value: "0100" },
          { label: "1:30 AM", value: "0130" },
          { label: "2:00 AM", value: "0200" },
          { label: "2:30 AM", value: "0230" },
          { label: "3:00 AM", value: "0300" },
          { label: "3:30 AM", value: "0330" },
          { label: "4:00 AM", value: "0400" },
          { label: "4:30 AM", value: "0430" },
        ]
      });

      self.repeatBox = new ui.Checkbox();

      self.okButton = ui.Button.create("Continue", function() {
        self.invokePlugin("next");
      });

      self.ele
        .append($("<div>").addClass("panel")
          .append($("<div>")
            .append($("<span>").text("" + 
              "A reminder is sent to your connection's Living Connections device or mobile " +
              "phone automatically at the time that you select.")))
          .append($("<div>")
            .append($("<span>").text("Select a time of day to deliver your reminder.")))
          .append($("<div style='padding-left:30px;'>")
            .append($("<span class='subtle'>").text("Deliver at: "))
            .append(self.deliverAtSelector.ele))
          .append($("<div>")
            .append($("<span>").text("" + 
              "You may also set up your reminder to be delivered each day at the same time.")))
          .append($("<div>")
            .append($("<span>").text("" + 
              "Check the box below to make your message repeat. ")))
          .append($("<div style='padding-left:30px;'>")
            .append(self.repeatBox.ele)
            .append($("<span class='subtle'>").text("Repeat every day")))
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
      self.scheduleEditor = new ScheduleEditor().addPlugin({
        next: function() {
          self.openVideoRecorder();
        }
      });
      self.ele.append(self.scheduleEditor.ele)

      self.videoRecorder = new VideoRecorder("<div>", {
        what: "reminder"
      }).addPlugin(self).setVisible(false);
      self.ele.append(self.videoRecorder.ele)
    });

    function openVideoRecorder(self) {
      self.scheduleEditor.setVisible(false).close();
      self.videoRecorder.setVisible(true).open();
    }

    c.extendPrototype({
      openVideoRecorder: function() {
        return openVideoRecorder(this);
      },
      saveMessage: function(assetId) {
        var self = this;
        return self.saveForm($.extend({}, self.data, {
          toUserId: self.actionItem.user.id,
          assetId: assetId,
          deliverAt: self.scheduleEditor.deliverAt,
          repeat: self.scheduleEditor.repeatHow
        }));
      },
      close: function() {
        this.videoRecorder.close();
        return this;
      }
    });
  });
});
