// checkbox.js

define([ "ui/input" ], function(Input) {

  return Input.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      self.input.attr("type", "checkbox");
      self._value = "";
    });
  });
});
