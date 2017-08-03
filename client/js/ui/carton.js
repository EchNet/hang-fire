// carton.js

define([ "ui/component" ], function(Component) {

  return Component.defineClass(function(c) {

    c.defineInitializer(function() {
      var self = this;
      self.compartments = {};
      self.states = {};
      self.current = {};
      self.goal = self.options.goalType && (new self.options.goalType());
      self.currentState = self.options.initialState;
    });

    function inState(self, state, compartmentKey) {
      if (state in self.states) {
        var stateSet = self.states[state];
        if (typeof stateSet == "string") {
          return stateSet == compartmentKey;
        }
        if (stateSet.length != null) {
          return stateSet.includes(compartmentKey);
        }
        return compartmentKey in stateSet;
      }
      return state == compartmentKey;
    }

    function addCompartment(self, key, component) {
      self.compartments[key] = component;
      if (!self.options.noAppend) {
        self.append(component);
      }
      var visible = self.options.initialState == null || inState(self, self.options.initialState, key);
      component.visible = visible;
      if (visible) {
        self.current[key] = component;
      }
      return self;
    }

    function showComponent(self, key) {
      var component = self.compartments[key];
      component.open();
      if (self.goal) {
        self.goal.addGoal(component, 1);
      }
      else {
        component.visible = true;
      }
    }

    function hideComponent(self, key) {
      var component = self.compartments[key];
      component.close();
      if (self.goal) {
        self.goal.addGoal(component, 0);
      }
      else {
        component.visible = false;
      }
    }

    function show(self, state) {
      if (state != self.currentState) {
        var newCurrent = {};
        for (var key in self.compartments) {
          var currentlyShown = key in self.current;
          var shouldBeShown = inState(self, state, key);
          if (shouldBeShown) {
            if (!currentlyShown) {
              showComponent(self, key);
            }
            newCurrent[key] = self.compartments[key];
          }
          else if (currentlyShown) {
            hideComponent(self, key);
          }
        }
        self.current = newCurrent;
        self.currentState = state;
      }
      return self;
    }

    c.extendPrototype({
      addCompartment: function(key, component) {
        return addCompartment(this, key, component);
      },
      addState: function(key, stateSet) {
        this.states[key] = stateSet;
        return this;
      },
      show: function(state) {
        return show(this, state);
      },
      open: function() {
        var self = this;
        for (var key in self.current) {
          self.current[key].open();
        }
        return self;
      },
      close: function() {
        var self = this;
        for (var key in self.current) {
          self.current[key].close();
        }
        return self;
      }
    });
  });
});
