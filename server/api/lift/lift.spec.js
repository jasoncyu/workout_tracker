'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /api/lifts', function() {
  it('should respond with JSON array', function(done) {
    request(app)
      .get('/api/lifts')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Array);
        done();
      });
  });
});


describe('POST /api/lifts', function() {
  it('should respond with a lift', function(done) {
    request(app)
      .post('/api/lifts')
      .send({
        name: 'bench press'
      })
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        res.body.name.should.be.instanceof(String);
        res.body.should.have.property('name', 'bench press');
        done();
      });
  });
});
