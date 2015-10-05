'use strict'

angular.module 'abbTrackerApp'
.controller 'MainCtrl', ($scope, $http, socket) ->
  $scope.awesomeThings = []

  $http.get('/api/things').success (awesomeThings) ->
    $scope.awesomeThings = awesomeThings
    socket.syncUpdates 'thing', $scope.awesomeThings

  $scope.addThing = ->
    return if $scope.newThing is ''
    $http.post '/api/things',
      name: $scope.newThing

    $scope.newThing = ''

  $scope.deleteThing = (thing) ->
    $http.delete '/api/things/' + thing._id

  $scope.$on '$destroy', ->
    socket.unsyncUpdates 'thing'

.controller 'WorkoutCtrl', ($scope, $http, socket) ->
  $http.get('/api/lifts').success (lifts) ->
    $scope.lifts = lifts

    $scope.lifts.forEach (lift) ->
      lift.sets.forEach (liftSet) ->
        liftSet.isEditing = false

    # Stop editing all sets
    $scope.stopEditing = () ->
      $scope.lifts.forEach (lift) ->
        lift.sets.forEach (liftSet) ->
          liftSet.isEditing = false

    $scope.toggleEditing = (thisSet) ->
      editedLift = _.find($scope.lifts, (lift) ->
        _.find(lift.sets, (liftSet) ->
          liftSet.isEditing
          )
        )
      console.log editedLift

      if editedLift
        $http
          .put("/api/lifts/#{editedLift._id}", editedLift)
          .then (res) ->
            console.log res.data
          .then (res) ->
            console.log 'error'


      # Stop editing all other sets.
      $scope.lifts.forEach (lift) ->
        lift.sets.forEach (liftSet) ->
          liftSet.isEditing = false
      thisSet.isEditing = true
