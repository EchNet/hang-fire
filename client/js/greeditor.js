// greeditor.js - Greeting Editor component

define([ "jquery", "services", "activityui", "vidrec", "button", "slideform" ],
  function($, Services, Activity, VideoRecorder, Button, SlideForm) {

  var apiService = Services.apiService;

  var GreetingSubmitForm = SlideForm.Form.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;

      var doneButton = Button.create("Done", function() {
        apiService.saveForm("gre", "cre", self.data)
        .then(function() {
          self.exit();
        });
      });

      var cancelButton = Button.create("Cancel", function() {
        self.exit();
      });

      self.container
        .append($("<div>")
          .addClass("formsect")
          .text("Press Done to send your greeting, or Cancel to throw it out."))
        .append($("<div>")
          .addClass("formsect")
          .append(doneButton.container)
          .append(cancelButton.container)
        );
    });
  });

  return Activity.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      var form = new SlideForm($("<div>").addClass("form"), {
        slides: [
          VideoRecorder,
          GreetingSubmitForm
        ]
      })
      form.addPlugin(self);
      self.container.append(form.container);
      self.form = form;
    });

    c.defineFunction("open", function(actionItem) {
      var self = this;
      Activity.prototype.open.call(self, actionItem);
      self.form.open(actionItem.greeting);
    });
  });

});