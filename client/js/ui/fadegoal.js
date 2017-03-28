// fadegoal.js - A cross-fade transition effect.

define([ "jquery" ], function($) {

  var DEFAULTS = {
    tick: 20,
    quantum: 10,
    decay: 0.9975,
    epsilon: 0.01
  };

  function now() {
    return new Date().getTime();
  }

  function FadeGoal(options) {
    $.extend(this, DEFAULTS, options);
    this.goals = [];
  }

  function getComponentOpacity(component) {
    var opacity = component.container.css("opacity");
    return opacity && parseFloat(opacity);
  }

  function setComponentOpacity(component, opacity) {
    component.container.css("opacity", opacity);
  }

  function kick(animation) {
    (function step() {
      setTimeout(function() {
        for (var i = 0; i < animation.goals.length; ) {
          var goal = animation.goals[i];
          var elapsedTime = now() - goal.startTime;
          var component = goal.component;
          var opacity = getComponentOpacity(component);
          var targetOpacity = goal.targetOpacity;
          if (Math.abs(targetOpacity - opacity) < animation.epsilon) {
            setComponentOpacity(component, "");
            if (targetOpacity == 0) {
              component.visible = false;
            }
            goal.promise.resolve(component);
            animation.goals.splice(i, 1);
          }
          else {
            var delta = (targetOpacity - opacity) * (1.0 - Math.pow(animation.decay, elapsedTime));
            setComponentOpacity(component, opacity + delta);
            ++i;
            goal.startTime = now();
          }
        }

        if (animation.goals.length) {
          step();
        }
      }, animation.tick);
    })();
  }

  function addGoal(animation, component, fadeIn) {
    for (var i = 0; i < animation.goals.length; ++i) {
      if (animation.goals[i].component == component) {
        animation.goals[i].targetOpacity = fadeIn ? 1 : 0;
        return animation.goals[i].promise;
      }
    }

    var promise = $.Deferred();

    var prevVisible = component.visible;
    component.visible = true;
    if (!prevVisible) {
      setComponentOpacity(component, 0);
    }
    else {
      var opacity = getComponentOpacity(component);
      if (opacity == null || opacity == "") {
        setComponentOpacity(component, 1);
      }
    }

    animation.goals.push({
      component: component,
      targetOpacity: fadeIn ? 1 : 0,
      startTime: now(),
      promise: promise
    });

    if (animation.goals.length == 1) {
      kick(animation);
    }
    return promise;
  }

  FadeGoal.prototype.addGoal = function(component, fadeIn) {
    return addGoal(this, component, fadeIn);
  }

  return FadeGoal;
});
