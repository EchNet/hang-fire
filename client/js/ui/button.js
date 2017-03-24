// button.js - standard button component

define([ "ui/component" ], function(Component) {

  var Button = Component.defineClass(function(c) { 

    c.defineDefaultOptions({
      html: "<button>"
    });

    c.defineInitializer(function() {
      var self = this;
      self.ele.on("keydown", function(event) {
        if (self.enabled && event.originalEvent.keyCode == 13) {
          self.click();
        }
        return true;
      });
      self.label = self.options.label || "";
    });

    c.defineProperty("label", {
      get: function() {
        return this.text;
      },
      set: function(label) {
        this.text = label;
      }
    });
  });

  // Handy factory method.
  Button.create = function(label, onClick) {
    return new Button().setLabel(label).addPlugin({
      onClick: onClick
    });
  }

  return Button;
});
