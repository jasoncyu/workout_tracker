'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    uniqueValidator = require('mongoose-unique-validator');

// Schema
var LiftSchema = new Schema({
  name: {type: String, required: true, unique: true}
});
LiftSchema.plugin(uniqueValidator);
LiftSchema.pre('save', function(next) {
  // Transform lift name into something like 'bench_press'
  this.name = this.name.toLowerCase().split(/\s/).join('_');
  next();
});

// Model
var Lift = mongoose.model('Lift', LiftSchema);

module.exports = Lift;
