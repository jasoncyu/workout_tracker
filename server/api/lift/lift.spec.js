'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

var Lift = require('../lift/lift.model').Lift;
var LiftSet = require('../lift/lift.model').LiftSet;
var WeightType = require('../lift/lift.model').WeightType;
var Promise = require('bluebird');
Promise.promisifyAll(require('mongoose'));

var _ = require('lodash');


var removeAllLifts = function(done) {
  Lift.remove({}, function() {
    done();
  });
};


describe('Set model', function() {
  it('should know if its reps are in its range or not', function(done) {
    var repRange = {targetMinReps: 8, targetMaxReps: 12};
    var testData = {
      10: true,
      undefined: false,
      14: false
    };
    for (var reps in testData) {
      var exp = testData[reps];
      var liftSet = new LiftSet(_.merge(repRange, {reps: reps}));
      var act = (liftSet).inRepRange();
      should.equal(act, exp);
    }
    done();
  });

  describe('Weight', function() {
    describe('going down by 10%', function() {
      it('should work', function(done) {
        done();
      });
    });

    describe('moving up linearly', function() {
      // Not sure why, but I'm getting a MongoError a result of
      // duplicate `setIndex` even though there is no longer a unique
      // index on `setIndex`.
      beforeEach(function(done) {
        removeAllLifts(done);
      });

      it('for barbells should work', function(done) {
        var testData = {
          100: 105,
          200: 205,
          300: 310,
          400: 410
        };
        var barbellLift = new Lift({
          name: 'deadlift',
          weightMedium: WeightType.BARBELL.value
        });

        var promises = [];
        _.forOwn(testData, function(exp, oldTarget) {
          promises.push(new Promise(function(resolve, reject) {
            barbellLift
              .addSet({targetWeight: oldTarget})
              .then(function(newSet) {
                // Get the variant of Set that has access to its parent
                // so that we can call the nextWeight function on it.
                var liftSet = barbellLift.sets.id(newSet);

                var act = liftSet.linearNextWeight({percent: 2.5});
                var exp = testData[liftSet.targetWeight];
                should.equal(act, exp);
                resolve();
              }).catch(function(err) {
                if (err) {
                  console.err(err);
                  throw err;
                }
                done();
              });
          }));
        });

        Promise.all(promises).then(function() {
          done();
        });
      });

      it('should work for cables that are multiples of 10', function(done) {
        var cableLift = new Lift({
          name: 'cable pushdown',
          weightMedium: WeightType.CABLE_MACHINE.value,
          weightMultiple: 10
        });
        var testData = {
          40: 50,
          50: 60,
          100: 110,
          200: 210
        };

        Promise.reduce(_.keys(testData), function(total, oldTarget) {
          return cableLift
            .addSet({targetWeight: oldTarget})
            .then(function(newSet) {
              var liftSet = cableLift.sets.id(newSet);

              var act = liftSet.linearNextWeight({percent: 2.5});
              var exp = testData[liftSet.targetWeight];
              console.log('work done');
              should.equal(act, exp);
            });
        }).then(function() {
          done();
        }).catch(function(err) {
          if (err) throw err;
        });
      });
    });
  });
});

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
      }).then(function(err, doc) {
        lift.sets[0].setIndex.should.be.eql(0);
        should.not.exist(lift.sets[0].targetWeight);
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
