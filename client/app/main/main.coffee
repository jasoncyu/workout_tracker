'use strict'

angular.module 'abbTrackerApp'
.config ($stateProvider) ->
  $stateProvider
  .state 'main',
    url: '/'
    templateUrl: 'app/main/main.html'
    controller: 'MainCtrl'
  .state 'workout',
    url: '/workout'
    templateUrl: 'app/main/workout.html'
    controller: 'WorkoutCtrl'
