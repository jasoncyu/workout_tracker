'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LiftSchema = new Schema({
  name: String
});

module.exports = mongoose.model('Lift', LiftSchema);
