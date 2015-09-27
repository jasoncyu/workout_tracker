/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Lift = require('./lift.model');

exports.register = function(socket) {
  Lift.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Lift.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('lift:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('lift:remove', doc);
}