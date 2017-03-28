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

    c.defineProperty("timeZone", {
      get: function() {
        return this.timeZoneSelector.value;
      }
    });

    c.defineProperty("repeatHow", {
      get: function() {
        return this.repeatHowSelector.value;
      }
    });

    c.defineInitializer(function() {
      var self = this;

      self.deliverAtSelector = new ui.DropDown({
        options: [
          { label: "12:00", value: 0 }, { label: "12:30", value: 1 }, { label: "13:00", value: 3 }, { label: "13:30", value: 4 }, { label: "14:00", value: 5 }, { label: "14:30", value: 6 }, { label: "15:00", value: 7 }, { label: "15:30", value: 8 }, { label: "16:00", value: 9 }, { label: "16:30", value: 10 }, { label: "17:00", value: 11 }, { label: "17:30", value: 12 }, { label: "18:00", value: 13 }, { label: "18:30", value: 14 }, { label: "19:00", value: 15 }, { label: "19:30", value: 16 }, { label: "20:00", value: 17 }, { label: "20:30", value: 18 }, { label: "21:00", value: 19 }, { label: "21:30", value: 20 }, { label: "22:00", value: 21 }, { label: "22:30", value: 22 }, { label: "23:00", value: 23 }, { label: "23:30", value: 24 }, { label: "24:00", value: 25 }, { label: "00:30", value: 26 }, { label: "01:00", value: 27 }, { label: "01:30", value: 28 }, { label: "02:00", value: 29 }, { label: "02:30", value: 30 }, { label: "03:00", value: 31 }, { label: "03:30", value: 32 }, { label: "04:00", value: 33 }, { label: "04:30", value: 34 }, { label: "05:00", value: 35 }, { label: "05:30", value: 36 }, { label: "06:00", value: 37 }, { label: "06:30", value: 38 }, { label: "07:00", value: 39 }, { label: "07:30", value: 40 }, { label: "08:00", value: 41 }, { label: "08:30", value: 42 }, { label: "09:00", value: 43 }, { label: "09:30", value: 44 }, { label: "10:00", value: 45 }, { label: "10:30", value: 46 }, { label: "11:00", value: 47 }, { label: "11:30", value: 48 },
        ]
      });
      
     self.timeZoneSelector = new ui.DropDown("<select>", {
        options: [
          { label: "Eastern Standard Time (EST)", value: 0 }, { label: "Central Standard Time (CST)", value: 1 }, { label: "Mountain Standard Time (MST)", value: 2 }, { label: "Pacific Standard Time (PST)", value: 3 }
        ]
      });
      
     self.repeatHowSelector = new ui.DropDown("<select>", {
        options: [
          { label: "Only Once", value: 0 }, { label: "Daily", value: 1 }, { label: "Weekly", value: 2 }
        ]
      });

		self.submitButton = ui.Button.create("Set Reminder", function() {
			self.invokePlugin("setReminder");
		});
		
      self.okButton = ui.Button.create("Record a message", function() {
        self.invokePlugin("openVideoRecorder");
      });

      self.ele
        .append($("<div>").addClass("panel")
          .append($("<div>")
            .text("Schedule a message to be delivered."))
          .append($("<div class='subtle'>")
          	.text("Time: ")
            .append(self.deliverAtSelector.ele))
          .append($("<div class='subtle'>")
			.text("Time zone: ")  
            .append(self.timeZoneSelector.ele))
          .append($("<div class='subtle'>")
          	.text("Repeat schedule: ")  
            .append(self.repeatHowSelector.ele))
          .append($("<div>")
            .append(self.submitButton.ele))  
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
	
	function setReminder(self) {
      self.ele.append("Your current reminder is set for: ")
    }
	
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
      setReminder: function() {
      	return setReminder(this);
      },
      saveMessage: function(assetId) {
        return this.saveForm($.extend({}, this.data, {
          assetId: assetId,
          deliverAt: this.scheduleEditor.deliverAt,
          timeZone: this.scheduleEditor.timeZone,
          repeat: this.scheduleEditor.repeatHow
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
