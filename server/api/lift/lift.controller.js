'use strict';

var _ = require('lodash');
var Lift = require('./lift.model');

// Get list of lifts
exports.index = function(req, res) {
  Lift.find(function (err, lifts) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(lifts);
  });
};

// Get a single lift
exports.show = function(req, res) {
  Lift.findById(req.params.id, function (err, lift) {
    if(err) { return handleError(res, err); }
    if(!lift) { return res.status(404).send('Not Found'); }
    return res.json(lift);
  });
};

// Creates a new lift in the DB.
exports.create = function(req, res) {
  Lift.create(req.body, function(err, lift) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(lift);
  });
};

// Updates an existing lift in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Lift.findById(req.params.id, function (err, lift) {
    if (err) { return handleError(res, err); }
    if(!lift) { return res.status(404).send('Not Found'); }
    var updated = _.merge(lift, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(lift);
    });
  });
};

// Deletes a lift from the DB.
exports.destroy = function(req, res) {
  Lift.findById(req.params.id, function (err, lift) {
    if(err) { return handleError(res, err); }
    if(!lift) { return res.status(404).send('Not Found'); }
    lift.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  if (err.name === 'MongoError') {
    return res.status(400).send(err);
  }
  return res.status(500).send(err);
}
