// dropdown.js - standard dropdown menu component 

define([ "jquery", "ui/component" ], function($, Component) {

  return Component.defineClass(function(c) { 

    c.defineDefaultOptions({ html: "<select>" });

    c.defineInitializer(function() {
      var self = this;
      var options = self.options.options;
      if (options) {
        for (var i = 0; i < options.length; ++i) {
          var opt = options[i];
          var label, value, selected;
          if (typeof opt == "string") {
            label = value = opt;
          }
          else {
            label = opt.label;
            value = opt.value;
            selected = opt.selected;
          }
          var optionElement = $("<option>").text(label).val(value);
          if (selected) {
            optionElement.attr("selected", "selected");
          }
          self.ele.append(optionElement);
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
        }
      }
    });
  });
});
