'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    uniqueValidator = require('mongoose-unique-validator'),
    _ = require('lodash');

/* Set */
var SetSchema = new Schema({
  // The index of this set relative to the Lift this belongs to.
  setIndex: {type: Number, required: true, unique: true},
  // TARGET. How many reps/sets we want to get.
  targetReps: {type: Number},
  targetWeight: {type: Number},
  // The number of reps in this set.
  reps: {type: Number},
  // The amount of weight used in this set.
  weight: {type: Number}
});
var Set = mongoose.model('Set', SetSchema);

/* Lift */
// Schema
var LiftSchema = new Schema({
  name: {type: String, required: true, unique: true},
  sets: [SetSchema]
});
LiftSchema.plugin(uniqueValidator);
LiftSchema.pre('save', function(next) {
  // Transform lift name into something like 'bench_press'
  this.name = this.name.toLowerCase().split(/\s/).join('_');
  next();
});
/* Add a set to this lift */
LiftSchema.methods.addSet = function(props, next) {
  var nextSetIndex = this.sets.length;
  // Approach 1
  // This approach doesn't work for some reason
  // var set = this.sets.create(
  //   {
  //     weight: props.weight,
  //     reps: props.reps,
  //     setIndex: nextSetIndex
  //   });

  // Approach 2
  this.sets.push(new Set({
    targetWeight: props.targetWeight,
    targetReps: props.targetReps,
    weight: props.weight,
    reps: props.reps,
    setIndex: nextSetIndex
  }));
  // Return the promise that resolves after `this` lift is done
  // saving.
  return this.save();
};

// Model
var Lift = mongoose.model('Lift', LiftSchema);

exports.Lift = Lift;
exports.Set = Set;
