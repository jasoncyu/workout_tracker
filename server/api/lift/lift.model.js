'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    uniqueValidator = require('mongoose-unique-validator');

// Schema
var LiftSchema = new Schema({
  name: {type: String, required: true, unique: true}
});
LiftSchema.plugin(uniqueValidator);

// Model
var Lift = mongoose.model('Lift', LiftSchema);

module.exports = Lift;
