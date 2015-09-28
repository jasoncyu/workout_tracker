'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var Lift = require('../lift/lift.model').Lift;

var removeAllLifts = function(done) {
  Lift.remove({}, function() {
    done();
  });
};

describe('Lift model', function() {
  before(function(done) {
    removeAllLifts(done);
  });
  after(function(done) {
    removeAllLifts(done);
  });

  it('can let you add sets', function(done) {
    Lift.create({name: 'bench press'}, function(err, lift) {
      if (err) throw err;

      lift.addSet({weight: 200, reps: 10}).then(function() {
        return lift.addSet({weight: 250, reps: 3});
      }).then(function() {
        lift.sets[0].setIndex.should.be.eql(0);
        lift.sets[1].setIndex.should.be.eql(1);
        lift.sets.length.should.be.eql(2);
        done();
      });
    });
  });
});

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
  var liftName = 'bench press';
  before(function(done) {
    removeAllLifts(done);
  });

  it('should respond with a lift', function(done) {
    request(app)
      .post('/api/lifts')
      .send({
        name: liftName
      })
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.should.be.instanceof(Object);
        res.body.name.should.be.instanceof(String);
        res.body.should.have.property('name', 'bench_press');
        done();
      });
  });

  it('should not allow creating two lifts with the same name', function(done) {
    request(app)
      .post('/api/lifts')
      .send({name: liftName})
      .expect(400)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('should not allow creating two lifts with the same name even if the case is different', function(done) {
    request(app)
      .post('/api/lifts')
      .send({name: liftName.toUpperCase()})
      .expect(400)
      .end(function(err, res) {
        if (err) return done(err);

        done();
      });
  });
});
