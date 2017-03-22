// dropdown.js - standard dropdown menu component 

define([ "jquery", "ui/component" ], function($, Component) {

  return Component.defineClass(function(c) { 

    c.defineDefaultContainer("<select>");

    c.defineInitializer(function() {
      var self = this;
      var options = self.options.options;
      if (options) {
        for (var i = 0; i < options.length; ++i) {
          var opt = options[i];
          var label, value;
          if (typeof opt == "string") {
            label = value = opt;
          }
          else {
            label = opt.label;
            value = opt.value;
          }
          self.ele.append($("<option>").text(label).val(value));
        }
      }
    });

    c.defineProperty("value", {
      get: function() {
        return this.ele.val();
      },
      set: function(val) {
        if (val != this.value) {
          this.ele.val(val);
          this.notifyChangeListeners();
        }
      }
    });
  });
});
