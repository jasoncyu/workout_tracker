'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    uniqueValidator = require('mongoose-unique-validator'),
    _ = require('lodash'),
    Enum = require('enum'),
    Promise = require('bluebird'),
    util = require('util');


var WeightType = new Enum({
  DUMBBELL: 'dumbbell',
  BARBELL: 'barbell',
  // The machines where you slot the metal L-shaped to select a weight
  // Usually the plates are each 10lbs.
  CABLE_MACHINE: 'cable_machine'});

/* LiftSet */
var SetSchema = new Schema({
  // The index of this set relative to the Lift this belongs to.
  setIndex: {type: Number, required: true},
  // TARGET. How many reps/sets we want to get.
  targetMinReps: {type: Number},
  targetMaxReps: {type: Number},
  targetWeight: {type: Number},
  // The number of reps in this set.
  reps: {type: Number},
  // The amount of weight used in this set.
  weight: {type: Number}
});
SetSchema.set('toJSON', {getters: true});
SetSchema.virtual('liftId').get(function() {
  return this.parent()._id;
});

/**
 * Returns true if this set has actual reps and those
 * reps are in the given rep range.
 */
SetSchema.methods.inRepRange = function() {
  if (!this.reps) {
    return false;
  }

  return (
    (this.reps >= (this.targetMinReps || Number.NEGATIVE_INFINITY)) &&
      (this.reps <= (this.targetMaxReps || Number.POSITIVE_INFINITY)));
};

/**
 * Returns a next set for the current set if the actual performance
 * exceeds the target performance.
 */
SetSchema.methods.buildNextSet = function(options) {
  options = options || {};

  // if ((this.weight >= this.targetWeight) && this.inRepRange()) {
  //   newSet = new Set({
  //     targetWeight: nextWeight({weight: this.targetWeight}),
  //     targetMinReps: this.targetMinReps,
  //     targetMaxReps: this.targetMaxReps
  //   });
  // }
};


/**
 * Returns the weight we're moving to, either up or down,
 * fashion by a given percent, 2.5 by default. So we go move in weight
 * by 2.5% or the next available weight, whichever is a larger jump.
 */
SetSchema.methods.linearNextWeight = function(params) {
  params = params || {};
  // We progress off of the old target weight.
  var oldWeight = this.targetWeight;
  // Default amount to increase current weight by
  params.percent = params.percent || 2.5;

  // Round down to nearest appropriate weight, unless that would mean
  // there's no change in weight, in which case we just increment to
  // the next available weight.

  // Barbells and dumbbells are both multiples of 5.
  // Cable machines vary, but the most common kind lets you load
  // multiples of 10.
  var lift = this.parent();

  // The amount of weight we should use next if we jump up by the
  // smallest amount of weight possible.
  var minJumpNextWeight = oldWeight + lift.weightMultiple;

  // The amount of weight we would jump to based on percentages.
  // We increase the weight, then round to the nearest multiple.
  var newRawWeight = oldWeight * (1 + params.percent / 100);
  var percentageBasedNextWeight = Math.round(
    newRawWeight / lift.weightMultiple) * lift.weightMultiple;
  // If the percentage based jump is too small, we jump to the next
  // possible weight. Otherwise, we use the percentage based jump.
  if (params.percent >= 0) {
    return Math.max(minJumpNextWeight, percentageBasedNextWeight);
  } else if (params.percent < 0) {
    return Math.min(minJumpNextWeight, percentageBasedNextWeight);
  }
};

var LiftSet = mongoose.model('LiftSet', SetSchema);

/* Lift */
// Schema
var LiftSchema = new Schema({
  name: {type: String, required: true},
  sets: [SetSchema],
  // The minimum amount of weight that can be loaded. It's constrained b/c
  // dumbbells only go so small, barbells only get so light, and the smallest
  // amount you can load on a cable machine is machine model dependent.
  weightMin: {type: Number},
  // For free weights, there isn't a max, but cable machines typically have a
  // max.
  weightMax: {type: Number},
  // The minimum amount of weight we can increase/decrease by.
  weightMultiple: {type: Number},
  // The type of thing (machine, dumbbell, barbell, etc.) that this
  // lift uses.
  // Store enum string values in mongo.
  weightMedium: {
    type: String,
    enum: WeightType.enums.map(function(o) {
      return o.value;
    })},
  // Top-set progression. A type of progression in which the first set
  // of a lift is the heaviest and uses `topWeight` weight. Then, each
  // subsequent set decreases until we have all `numSets` sets.
  topSetProgression: {
    numSets: {type: Number},
    topWeight: {type: Number},
    // The percentage to decrease the weight by between sets in this
    // lift.
    betweenSetPercentDown: {type: Number},
    // The amount to increase the top set by.
    topSetPercentUp: {type: Number}
  }
});

LiftSchema.plugin(uniqueValidator);
LiftSchema.pre('save', function(next) {
  // Transform lift name into something like 'bench_press'
  this.name = this.name.toLowerCase().split(/\s/).join('_');

  // Set reasonable weight info for barbells and dumbbells.
  // We're counting on cable machine lifts to set this themselves.
  if (this.weightMedium === WeightType.BARBELL.value) {
    this.weightMin = 45;
    this.weightMultiple = 5;
  } else if (this.weightMedium === WeightType.DUMBBELL.value) {
    this.weightMin = 5;
    this.weightMax = 150;
    this.weightMultiple = 5;
  }
  next();
});
// Methods need to be declared on the schema *before* the model
// is registered.
/**
 * Adds another set to this lift. Adding sets in succession
 * needs to be done synchronously because set order matters.
 */
LiftSchema.methods.addSet = function(props, next) {
  var nextSetIndex = this.sets.length;
  var newSet = new LiftSet({
    targetWeight: props.targetWeight,
    targetMinReps: props.targetMinReps,
    targetMaxReps: props.targetMaxReps,
    weight: props.weight,
    reps: props.reps,
    setIndex: nextSetIndex
  });

  this.sets.push(newSet);
  // Return the promise that resolves after `this` lift is done
  // saving.
  var lift = this;
  return new Promise(function(resolve, reject) {
    lift.saveAsync().then(function() {
      // The new set resolved here doesn't have access to its parent,
      // but it doesn't have an id, so the parent can access it that way.
      resolve(newSet);
    }).catch(function(err) {
      if (err) {
        console.log(err);
        throw err;
      };
    });
  });
};


/**
 * Creates the next top-set progression lift after successfully
 * doing a top-set lift.
 */
LiftSchema.statics.createNextTopSetLift = function(lastLift) {
  // Copy over relevant fields
  return Lift.createAsync(_.pick(lastLift, [
    'name', 'weightMin', 'weightMax', 'weightMultiple',
    'weightMedium', 'topSetProgression'
  ])).then(function(lift) {
    var lastTopSet = lastLift.sets[0];
    var nextTopSetWeight = lastTopSet.linearNextWeight({
      percent: lastLift.topSetProgression.topSetPercentUp});

    return Promise.reduce(
      new Array(lift.topSetProgression.numSets),
      function(weight) {
        return lift
          .addSet({targetWeight: weight})
          .then(function(newSet) {
            return lift.sets.id(newSet).linearNextWeight({
              percent: -lift.topSetProgression.betweenSetPercentDown
            });
          });
      },
      nextTopSetWeight
    ).then(function() {
      return lift;
    });
  }).catch(function(err) {
    console.log('in createNextTopSetLift');
    console.log(err.message);
    throw err;
  });
};

// Subclassing Error by using the strategy found here:
// http://dailyjs.com/2014/01/30/exception-error/
function LiftError(message) {
  this.message = message;
}
util.inherits(LiftError, Error);

// Model
var Lift = mongoose.model('Lift', LiftSchema);

exports.Lift = Lift;
exports.LiftSet = LiftSet;
exports.WeightType = WeightType;
