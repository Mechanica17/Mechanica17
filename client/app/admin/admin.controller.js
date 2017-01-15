'use strict';

export default class AdminController {
  /*@ngInject*/
  constructor(User, $http, $scope, $interval,$location) {
    // Use the User $resource to fetch all users
    this.users = User.query();
    $http.get('api/houses/').then(function(response){
      console.log(response);
    })
    $scope.populateTeams = function(){
      var i=0;
      $interval(function(){
        $http.post('api/houses/'+i).then(function(response){
        	console.log(response);
          i++;
        }).then(function(err){
          console.log(err);
        })
      },10000,4)
    }
     $scope.submitted=false;
     $scope.submitted1=false;
     $scope.isCollapsed=true;
     $scope.isCollapsed1=false;
     $scope.isCollapsed2=true;
     $scope.isCollapsed3=true;
     $scope.dateOpen=false;
     $scope.ismeridian=true;
     $scope.participantIds=[];
     $scope.participants=[];
     
     $scope.startTime=new Date;
     $scope.startTime.setHours($scope.startTimeHrs);
     $scope.startTime.setMinutes($scope.startTimeMins);
     $scope.endTime=new Date;
     $scope.endTime.setHours($scope.endTimeHrs);
     $scope.endTime.setMinutes($scope.endTimeMins);
    

    $http.get('/api/meaEvents')
      .then(response => {
        $scope.events = response.data;

      });


    $http.get('/api/houses/display/leaderboard')
      .then(response => {
        console.log("Leader board")
        console.log(response.data);

      });

      $scope.registered=function(eventId){
        
        $http.get('/api/meaEvents/'+eventId)
          .then(response => {
              $scope.registeredUsers = response.data.users;

              for(var i in $scope.registeredUsers)
               {
                $scope.participantIds.push($scope.registeredUsers[i].user);
               }
              
              for(var j in $scope.participantIds)
               {
                $http.get('/api/users/'+$scope.participantIds[j])
                .then(response => {
                      $scope.participants.push(response.data);
                      
                    });

               }
               console.log($scope.participants);
               for(var k in $scope.participants)
                         {
                          $http.get('/api/houses/'+$scope.participants[k].house)
                            .then(response => {
                              $scope.participants[k].houseName=response.data.name;
                            }

                            );
                         }
            });    
        }

     $scope.eventSubmit=function(form){
      $scope.submitted=true;
      if(form.$valid)
      {
        $http.post('/api/events',
          { 
            name:$scope.name,
            info:$scope.info,
            awards:$scope.awards,
            faq:$scope.faq,
            rules:$scope.rules,
            date:$scope.date,
            startTime:$scope.startTime,
            endTime:$scope.endTime
     

          }
        ).then(function(response){
          $location.path('/');
        }).then(function(err){
          console.log(err);
        })
      
      }
    };
    
    $scope.meaEventSubmit=function(form){
      $scope.submitted=true;
      if(form.$valid)
      {
        $http.post('/api/meaEvents',
          { 
            name:$scope.meaName,
            venue:$scope.meaVenue,
            info:$scope.meaInfo,
            date:$scope.meaDate
          }
        ).then(function(response){
          $location.path('/');

        }).then(function(err){
          console.log(err);
        })
      
      }
    };

    $scope.eventCategorySubmit=function(form){
      $scope.submitted1=true;
      if(form.$valid)
      {
        $http.post('/api/eventCategorys',
          { 
            name:$scope.CategoryName,
            info:$scope.CategoryInfo
          }
        ).then(function(response){
          $location.path('/');

        }).then(function(err){
          console.log(err);
        })
      
      }
    };

    
  }

  delete(user) {
    user.$remove();
    this.users.splice(this.users.indexOf(user), 1);
  }
}
