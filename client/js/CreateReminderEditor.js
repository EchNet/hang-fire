// CreateReminderEditor.js

define([ "jquery", "Services", "Activity", "VideoRecorder", "ui/index" ],
function($,        Services,   Activity,   VideoRecorder,   ui) {

  var IntroView = ui.Component.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;

      self.okButton = ui.Button.create("Continue", function() {
        self.invokePlugin("next");
      });

      self.ele.append($("<div>")
        .append($("<div class='chunk'>").text("" + 
            "A reminder is a videogram that is sent automatically to your connection " +
            "on the schedule that you select."))
        .append($("<div class='chunk'>").text("" + 
            "You can use reminders to help someone remember an important appointment or " +
            "medication schedule, or just to stay in touch."))
        .append($("<div class='chunk'>").text("" +
            "If you wish to continue, we will take you through the steps of setting up " +
            "a schedule and recording a videogram."))
        .append($("<div class='chunk'>")
          .append(self.okButton.ele))
      );
    });
  });

  var ScheduleEditor = ui.Component.defineClass(function(c) {

    function makeErrorLabel(text) {
      return new ui.Component({ html: "<span>", cssClass: "error" }).setText(text).setVisible(false);
    }

    c.defineProperty("repeat", {
      get: function() {
        return this.repeatBox.value ? 1 : 0;
      }
    });

    c.defineInitializer(function() {
      var self = this;
      var reminder = self.options.reminder;

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
      }).addPlugin({
        onChange: function(deliverAt) {
          reminder.deliverAt = deliverAt;
          reminder.dirty = true;
        }
      }).setValue(reminder.deliverAt || "1200");

      self.repeatBox = new ui.Checkbox().addPlugin({
        onChange: function(repeat) {
          reminder.repeat = repeat;
          reminder.dirty = true;
        }
      }).setValue(reminder.repeat);

      self.okButton = ui.Button.create("Continue", function() {
        self.invokePlugin("next");
      });

      self
        .append(new ui.Component().addClass("chunk")
          .setText("Select a time of day to deliver your reminder."))
        .append(new ui.Component("<div style='padding-left:30px;'>").addClass("chunk")
          .append(new ui.Component("<span class='subtle'>").setText("Deliver at: "))
          .append(self.deliverAtSelector))
        .append(new ui.Component().addClass("chunk")
          .append(new ui.Component().setText("" +
            "You may also set up your reminder to be delivered every day at the same time."))
          .append(new ui.Component().setText("Check the box below to make your message repeat."))
          .append(new ui.Component("<div style='padding-left:30px;'>").addClass("chunk")
            .append(self.repeatBox)
            .append(new ui.Component("<span class='subtle'>").setText("Repeat every day"))))
        .append(new ui.Component().addClass("chunk")
          .append(self.okButton))
    });

    c.extendPrototype({
      open: function() {
        this.repeatBox.value = this.repeat;
        return this;
      }
    });
  });

  var SummaryView = ui.Component.defineClass(function(c) {

    function formatDeliverAt(time) {
      var hrs = parseInt(time.substring(0, time.length - 2));
      var ampm = hrs >= 12 ? "PM" : "AM";
      if (hrs > 12) hrs -= 12;
      else if (hrs == 0) hrs = 12;
      var mins = time.substring(time.length - 2);
      return hrs + ":" + mins + " " + ampm;
    }

    c.defineInitializer(function() {
      var self = this;
      var reminder = self.options.reminder;

      self.prompt = new ui.Component();

      var scheduleView = (function() {
        var prompt = new ui.Component().addClass("subtle").setText("Schedule:");
        self.scheduleLabel = new ui.Component("<span>");
        var changeButton = ui.Button.create("change", function() {
          self.invokePlugin("editSchedule");
        }).addClass("subtle");
        return new ui.Component().addClass("chunk")
          .append(prompt)
          .append(new ui.Component()
            .append(self.scheduleLabel)
            .append(new ui.Component("<span>").setText(" "))
            .append(changeButton))
      })();

      var videoView = (function() {
        var prompt = new ui.Component().addClass("subtle").setText("Videogram:");
        self.videoPlayer = new ui.Video().addPlugin({
          onClick: function() {
            self.videoPlayer.replay();
          }
        });
        self.videoPlayer.ele.css({ "width": 240, "display": "inline-block" });
        var changeButton = ui.Button.create("change", function() {
          self.invokePlugin("editVideo");
        }).addClass("subtle");
        return new ui.Component().addClass("chunk")
          .append(prompt)
          .append(new ui.Component()
            .append(self.videoPlayer)
            .append(new ui.Component("<span>").setText(" "))
            .append(changeButton))
      })();

      function saveReminder() {
        return Services.apiService.saveForm("rem", reminder.id == null ? "cre" : "upd", reminder)
        .then(function(responseObject) {
          reminder.id = responseObject.id;
        });
      }

      function deleteReminder() {
        return Services.apiService.saveForm("rem", "del", {
          id: reminder.id,
        }).then(function() {
          reminder.id = null;
        });
      }

      var buttons = (function() {
        self.saveButton = ui.Button.create("Save", saveReminder).setVisible(false);
        self.activateButton = ui.Button.create("Activate", saveReminder).setVisible(false);
        self.deleteButton = ui.Button.create("Delete this reminder", deleteReminder).setVisible(false);
        return new ui.Component().addClass("chunk").append(self.saveButton).append(self.activateButton).append(self.deleteButton);
      })();

      self.append(prompt).append(scheduleView).append(videoView).append(buttons);
    });

    function open(self) {
      var reminder = self.options.reminder;
      var isUpdate = !!reminder.id;
      var repeat = reminder.repeat;
      var deliverAt = reminder.deliverAt;
      var assetUrl = reminder.asset && reminder.asset.url;

      self.prompt.text =  isUpdate
        ? (reminder.dirty ? "Click save to make changes." : "You have activated a reminder.")
        : "Your reminder is ready to be activated. " +
          "It will not be activated until you click the Activate button below.";

      var scheduleText = (repeat ? "Every day at " : "One time at ") + formatDeliverAt(deliverAt);
      self.scheduleLabel.setText(scheduleText);

      if (assetUrl) {
        self.videoPlayer.load(assetUrl);
      }

      self.activateButton.visible = !isUpdate;
      self.saveButton.visible = reminder.dirty && isUpdate;
      self.deleteButton.visible = isUpdate;
      return self;
    }

    c.extendPrototype({
      open: function() {
        open(this);
        return this;
      },
      close: function() {
        this.videoPlayer.clear();
        return this;
      },
    });
  });

  return Activity.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      var reminder = self.actionItem.reminder || {
        toUserId: self.actionItem.user.id,
        toUser: self.actionItem.user
      }
      self.actionItem.reminder = reminder;
      var isUpdate = reminder.id != null;

      // Construct carton, which manages visibility of the different editor views.
      self.carton = new ui.Carton({
        cssClass: "panel",
        initialState: isUpdate ? "summaryView" : "introView"
      });
      self.append(self.carton);

      // Construct intro view.
      if (!isUpdate) {
        self.carton.addCompartment("introView", new IntroView().setVisible(false).addPlugin({
          next: function() {
            self.carton.show("scheduleEditor");
          }
        }));
      }

      // Construct schedule view.
      self.scheduleEditor = new ScheduleEditor({ reminder: reminder }).addPlugin({
        next: function() {
          self.carton.show(isUpdate ? "summaryView" : "videoRecorder");
        }
      });
      self.carton.addCompartment("scheduleEditor", self.scheduleEditor);

      // Construct video recorder view.
      self.videoRecorder = new VideoRecorder("<div>", {
        acceptButtonLabel: "Use it",
        what: "reminder message"
      }).addPlugin({
        saveMessage: function(assetId) {
          reminder.assetId = assetId;
          reminder.asset = self.videoRecorder.asset;
          self.carton.show("summaryView");
        },
      });
      self.carton.addCompartment("videoRecorder", self.videoRecorder);

      // Construct summary view.
      self.summaryView = new SummaryView({
        reminder: reminder
      }).addPlugin({
        editSchedule: function() {
          self.carton.show("scheduleEditor");
        },
        editVideo: function() {
          self.carton.show("videoRecorder");
        }
      });
      self.carton.addCompartment("summaryView", self.summaryView);
    });

    c.extendPrototype({
      open: function () {
        this.carton.open();
        return this;
      },
      close: function() {
        this.carton.close();
        return this;
      }
    });
  });
});
