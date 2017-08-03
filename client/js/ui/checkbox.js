// checkbox.js

define([ "ui/input" ], function(Input) {

  return Input.defineClass(function(c) {

    c.defineInitializer(function() {
      this.input.attr("type", "checkbox");
    });

    c.defineProperty("value", {
      get: function() {
        return !!this.element.checked
      },
      set: function(val) {
        this.element.checked = !!val;
      }
    });

    c.extendPrototype({
      _filterOutValue: function(value) {
        return !!value;
      },
    });
  });
});
