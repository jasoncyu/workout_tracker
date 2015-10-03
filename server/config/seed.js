/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Thing = require('../api/thing/thing.model');
var User = require('../api/user/user.model');
var Lift = require('../api/lift/lift.model').Lift;
var WeightType = require('../api/lift/lift.model').WeightType;
var Promise = require('bluebird');
Promise.promisifyAll(require('mongoose'));


Thing.find({}).remove(function() {
  Thing.create({
    name : 'Development Tools',
    info : 'Integration with popular tools such as Bower, Grunt, Karma, Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, Stylus, Sass, CoffeeScript, and Less.'
  }, {
    name : 'Server and Client integration',
    info : 'Built with a powerful and fun stack: MongoDB, Express, AngularJS, and Node.'
  }, {
    name : 'Smart Build System',
    info : 'Build system ignores `spec` files, allowing you to keep tests alongside code. Automatic injection of scripts and styles into your index.html'
  },  {
    name : 'Modular Structure',
    info : 'Best practice client and server structures allow for more code reusability and maximum scalability'
  },  {
    name : 'Optimized Build',
    info : 'Build process packs up your templates as a single JavaScript payload, minifies your scripts/css/images, and rewrites asset names for caching.'
  },{
    name : 'Deployment Ready',
    info : 'Easily deploy your app to Heroku or Openshift with the heroku and openshift subgenerators'
  });
});

User.find({}).remove(function() {
  User.create({
    provider: 'local',
    name: 'Test User',
    email: 'test@test.com',
    password: 'test'
  }, {
    provider: 'local',
    role: 'admin',
    name: 'Admin',
    email: 'admin@admin.com',
    password: 'admin'
  }, function() {
      console.log('finished populating users');
    }
  );
});

Lift.find({}).removeAsync(function() {
  Lift.createAsync({
    name: 'bench press',
    sets: [
      {
        setIndex: 0,
        weight: 250,
        reps: 10
      },
      {
        setIndex: 1,
        weight: 230,
        reps: 10
      },
      {
        setIndex: 2,
        weight: 210,
        reps: 10
      }
    ],
    weightMedium: WeightType.BARBELL.value,
    topSetProgression: {
      numSets: 3,
      topWeight: 250,
      betweenSetPercentDown: 10,
      topSetPercentUp: 5
    }
  }).catch(function(err) {
    if (err) throw err;
  }).then(function() {
    Lift.createAsync({
      name: 'deadlift',
      sets: [
        {
          setIndex: 0,
          weight: 400,
          reps: 3
        },
        {
          setIndex: 1,
          weight: 350,
          reps: 5
        },
        {
          setIndex: 2,
          weight: 210,
          reps: 7
        }
      ],
      weightMedium: WeightType.BARBELL.value,
      topSetProgression: {
        numSets: 3,
        topWeight: 250,
        betweenSetPercentDown: 10,
        topSetPercentUp: 5
      }
    }).catch(function(err) {
      if (err) throw err;
    });
  });
}).catch(function(err) {
  if (err) throw err;
});
