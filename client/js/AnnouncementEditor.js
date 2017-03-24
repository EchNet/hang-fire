// AnnouncementEditor.js - Announcement Editor component

define([ "jquery", "Activity", "VideoRecorder", "ui/index" ],
function($,        Activity,     VideoRecorder,   ui) {

  return Activity.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;

      var typeSelector = new ui.RadioGroup({
        groupName: "annType",
        choices: [
          { value: 3, label: "To all users" },
          { value: 4, label: "To new users" }
        ]
      });

      var startDatePicker = new ui.DateTimeInput("<span>");
      startDatePicker.addChangeListener(function(value) {
        self.data.startDate = value;
      });

      var endDatePicker = new ui.DateTimeInput("<span>");
      endDatePicker.addChangeListener(function(value) {
        self.data.endDate = value;
      });

      var videoRecorder = new VideoRecorder("<div>", {
        what: "announcement"
      }).addPlugin(self);

      self.ele
        .append($("<div>").addClass("panel")
          .append($("<div>")
            .text("Announce to all users, or only to new users?"))
          .append(typeSelector.ele)
        )
        .append($("<div>").addClass("panel")
          .append($("<div>")
            .append($("<span>").text("Start date: "))
            .append(startDatePicker.ele))
          .append($("<div>")
            .append($("<span>").text("End date: "))
            .append(endDatePicker.ele))
        )
        .append(videoRecorder.ele)

      self.typeSelector = typeSelector;
      self.startDatePicker = startDatePicker;
      self.endDatePicker = endDatePicker;
      self.videoRecorder = videoRecorder;

      self.data = self.actionItem.message || {};
    });

    var ONE_WEEK = 7*24*60*60*1000;

    function open(self) {
      var data = self.data;
      self.typeSelector.apparentValue = data.type;
      var startDate = data.startDate ? new Date(data.startDate) : new Date();
      var endDate = data.endDate ? new Date(data.endDate) : new Date(startDate.getTime() + ONE_WEEK);
      self.startDatePicker.value = startDate;
      self.endDatePicker.value = endDate;
      self.videoRecorder.open(data.asset && data.asset.url);
      return self;
    }

    c.extendPrototype({
      open: function() {
        return open(this);
      },
      saveMessage: function(assetId) {
        return this.saveForm($.extend({}, this.data, {
          assetId: assetId,
          type: this.typeSelector.value,
          startDate: this.startDatePicker.value,
          endDate: this.endDatePicker.value
        }));
      },
      close: function() {
        this.videoRecorder.close();
        return this;
      }
    });
  });
});
