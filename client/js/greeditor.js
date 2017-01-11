// greeditor.js - Greeting Editor component

define([ "jquery", "services", "vidrec", "button", "slideform" ],
  function($, Services, VideoRecorder, Button, SlideForm) {

  // Service imports.

  var apiService = Services.apiService;

  var GreetingSubmitForm = SlideForm.Form.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;

      var doneButton = Button.create("Done", function() {
        self.save();
      });

      var cancelButton = Button.create("Cancel", function() {
        self.cancel();
      });

      self.container
        .append($("<div>")
          .text("Press Done to send your greeting, or Cancel to throw it out."))
        .append($("<div>")
          .append(doneButton.container)
          .append(cancelButton.container)
        );
    });

    c.defineFunction("save", function() {
      return apiService.saveForm("gre", "upd", self.data);
    });
  });

  return SlideForm.defineClass(function(c) {

    c.defineDefaultOptions({
      slides: [
        VideoRecorder,
        GreetingSubmitForm
      ]
    });
  })
});
