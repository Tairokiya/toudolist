  angular.module('starter.controllers',['ngStorage','wilddog','ionic'])

  .controller('DashCtrl', function($scope) {})

  .controller('ChatsCtrl', function($scope, Chats) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.chats = Chats.all();
    $scope.remove = function(chat) {
      Chats.remove(chat);
    };
  })

  .controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
  })

  .controller('AccountCtrl', function($scope) {
    $scope.settings = {
      enableFriends: true
    };
  })

  .controller('TasksCtrl',
    function($scope, $localStorage, $wilddogObject, $wilddogArray, $ionicModal, $ionicPopover){

      /**************
       * Scope Vars *
       **************
       * $scope.taskPrototypes = [{task}]
       * $scope.donesRaw = {(records stored by date)}
       * $scope.todayStatus = {-1,0,1,2,3}
       * $scope.latest = {(latest time stamp)}
       * $scope.standard = {}
       * */
      $scope.scopeVars = ["taskPrototypes","donesRaw","todayStatus","latest"];

      $scope.taskPrototypes = null;
      $scope.donesRaw = null;    /*  Status Code [-1,0,1,2,3] *//*
       -1 + yet to be finished,
       0 + finished on time,
       1 + not finished on time,
       2 + forgiven,
       3 + can not be forgiven */ //
      $scope.todayStatus = {};
      $scope.standard = {
        newDateTime: function(){
          var today = new Date();
          var nextFlushDay = new Date();
          nextFlushDay.setHours(4,0,0,0);
          if (nextFlushDay < today) {nextFlushDay.setDate(nextFlushDay.getDate() + 1);}
          return nextFlushDay;
        }
      };
      $scope.latest = { //Mind the month!!!// Servant Master Marked Time
         markedTime: new Date(1997,1,27),
         masterMarkedTime : new Date(1997,6,30),
      };
      $scope.element = {
        refresher: {
          show: true
        }
      };


      $ionicModal.fromTemplateUrl('templates/modals/refreshHUD.html', function(modal){
        $scope.refreshHUD = modal;
      },{
        scope: $scope,
        animation: 'slide-in-right'
      });

      $scope.setPlatform = function(p) {
        document.body.classList.remove('platform-ios');
        document.body.classList.remove('platform-android');
        document.body.classList.add('platform-' + p);
      };

      $scope.hideHUD = function(){
        $scope.refreshHUD.hide();
      };

      $ionicModal.fromTemplateUrl('templates/modals/add-prototype.html',function(modal){
        $scope.prototypeView = modal;
      },{
        scope : $scope,
        animation : "slide-in-right"
      });

      $scope.showAddPrototypeModal = function(){
        $scope.prototypeView.show();
      };

      $scope.addPrototype = function(title, detail, punishRequest){
        window.alert("title = " + title + " detail = "+ detail + "punish = " + punishRequest);
        $scope.prototypeView.hide();
      };



      $scope.hello = function(){
        $scope.$broadcast('scroll.refreshComplete');
      };

      $scope.helloPunish = function () {
        alert("No alterable");
      };

      $scope.getRemainDays = function getRemianDays(taskid) {
        var until = $scope.taskPrototypes[taskid].until;
        return (new Date(until) - new Date()) / 86400000 | 0;
      };

      $scope.getTotalDays = function totalDays(taskid){
        var from  = $scope.taskPrototypes[taskid].from;
        var until = $scope.taskPrototypes[taskid].until;
        return (new Date(until) - new Date(from)) / 86400000 | 0;
      };

      $scope.getMaxContinuousCombo = function getMaxContinuousCombo(taskid){};

      $scope.getTotalPunishNum = function getTotalPunishNum(taskid){
        return {normal:0, dead:0};
        //var task = $scope.history[taskid];
        //var punish = 0;
        //var punish_dead = 0;
        //
        //for (var i in task){
        //  if (i == 1){punish += 1;}
        //  if (i == 3){punish_dead += 1;}
        //}
        //
        //return {normal:punish, dead:punish_dead};
      };

      // tag mode : yyyy/mm/dd : which is a dir name
      function getSupposedDateTag(date){
        var supposedDate = date ? date : new Date();
        if (supposedDate.getHours() < 4){
          supposedDate.setDate(supposedDate.getDate()-1);
        }
        return new Intl.DateTimeFormat('zh').format(supposedDate) ;
      }

      // upload finish status to server : raw + aligned
      $scope.uploadFinishedStatus = function didMarkFinished(taskid){
        if ($scope.todayStatus[taskid] !== -1){ return;}

        // 0 Local status toggle-change and animation setting
        console.log($scope.todayStatus);

        var changeTo = function(val){
          if(val == 0){return -1;}
          if(val == -1){return 0;}
        }($scope.todayStatus[taskid]);

        $scope.todayStatus[taskid] = changeTo;

        $localStorage.todayStatus = $scope.todayStatus;
        $localStorage.latest.markedTime = $scope.latest.markedTime = new Date();

        // 1 upload to server doneRaws and stay connected
        var now = new Date();
        var datetag = getSupposedDateTag(now);
        var obj = $wilddogObject(wilddog.sync().ref("donesRaw/" + datetag));
        obj.$loaded().then(function(){
          console.log("Successfully download obj? ",obj.$id, obj);
          obj[taskid] = {
            timestamp : now.toString()
          };
          obj.$save().then(function(ref){
            console.log("Successfully logged a task!", obj.$id, obj);
          },function(err){
            console.log("Errored :[", ref)
          },function(back){
          });
        }.bind(obj));

        // 2 upload to Today Status and stay connected
        var today = $wilddogObject(wilddog.sync().ref("todayStatus/"));
        today.$loaded().then(function(){

          // 2 - 1  if first initial then copy every element
          var firstInit = false;

          angular.forEach($scope.todayStatus, function(value,key){
            if (!(key in today)) {firstInit = true;}
          });

          if(firstInit){
            angular.forEach($scope.todayStatus,function(value,key){today[key] = value;});
          }else{
            today[taskid] = changeTo;
          }

          today.$save().then(function(ref){
            console.log("save task sucess!", ref, today);
            $scope.todayStatus = today;
          },function(err){
            console.log("save data error", err);
          });
        }.bind(today));

        // 3 upload as history and stay connected
        var dones = $wilddogObject(wilddog.sync().ref("dones/" + taskid));
        dones.$loaded().then(function(){
          // date format : yyyy-mm-dd
          var dateTag = getSupposedDateTag().split('/').join('-');
          dones[dateTag] = 0;
          console.log(dones);
          dones.$save().then(function(ref){
            console.log("save task success!", ref, dones);
            //$scope.dones = dones;
          });
        }.bind(dones));

      };

      // reset today status to all not marked
      function shouldResetTodayStatus(){
        // Condition = (Time Exceed Validation) || (ID not accord)
        // 1 Time Exceed
        var newDateTime = $scope.standard.newDateTime();
        var onedayElapsedTime = 86400000;
        var isTimeExceed = (newDateTime - $scope.latest.markedTime > onedayElapsedTime);

        // 2 ID not accord
        angular.forEach($scope.taskPrototypes, function(value,key){
          console.log(key,value);
        });

        angular.forEach($scope.todayStatus, function(value,key){
          console.log(key,value);
        });

        //var isIDNotAccord = true;
        var isIDNotAccord = false;


        return isTimeExceed || isIDNotAccord;
      }

      function resetTodayStatus(force){
        if (shouldResetTodayStatus() || force === true) {
          $scope.taskPrototypes.forEach(function(item) {
            $scope.todayStatus[item.id] = -1;
          });
          $scope.latest.markedTime = new Date();
        }
      }

      function force_reset(){
        angular.forEach($scope.taskPrototypes, function(value, key){
          $scope.todayStatus[key] = -1;
        });
        var obj = $wilddogObject(wilddog.sync().ref("todayStatus"));
        obj.$remove().then(function(){
          obj = $scope.todayStatus;
          obj.$save().then(function(){
            console.log("Taskprototypes saved.")
          })
        })

      }

      function force_upload(){
        var obj = $wilddogObject(wilddog.sync().ref("taskPrototypes"));
        console.log(obj);

        obj.$loaded().then(function(){
          console.log("Loaded",obj);
          console.log($scope.taskPrototypes);
          obj.$value = $scope.taskPrototypes;
          console.log("Saving",obj);
          obj.$save().then(function(ref){
            console.log("Success",obj);
          }.bind(obj));
        }.bind(obj));
      }

      // fetch all data dispite correctness from server (raw)
      function fetchAllData(callback) {
        // This will cost a lot of datas so only invoke if we need
        var wdgBuffer = $wilddogObject(wilddog.sync().ref());
        wdgBuffer.$loaded().then(function () {
          console.log("Loaded :", wdgBuffer.$id, wdgBuffer);
          // Mind here : a retain cycle!!
          callback(wdgBuffer);
        });
      }
      function didFetchTaskPrototypes(){

      }
      function shouldAdjustCloudStatus(){}
      function adjustCloudStatus(){}
      function didAdjustCloudStatus(){}


      // fetch data dispite correctness
      function dataBuffering(callback){
        var shouldFetchAllFromCloud = true; // default: false, to fetch from local

        // Fetch from Server
        var scopevars = $scope.scopeVars;
        var remain = 0;

        scopevars.forEach(function(item,index,array){
            if ($scope.hasOwnProperty(item)){
              var temp = {};
              temp[item]=$wilddogObject(wilddog.sync().ref(item));
              temp[item].$loaded().then(function(){
                $scope[item] = temp[item];
                remain += 1;
                if(remain === scopevars.length){callback();}
              }.bind(this));
            }else{remain += 1;}
          }.bind(this));
      }
      function didDataBuffered(){
        resetTodayStatus();
        $scope.hello();
      }

      $scope.defaultifyStorage = function(){
        $localStorage.$default = {};
      };

      $scope.resetTodayStatus = resetTodayStatus;
      $scope.fetchAllData = fetchAllData;
      $scope.dataBuffering = dataBuffering;
      $scope.force_upload = force_upload;
      $scope.force_reset = force_reset;
      $scope.dataBuffering = dataBuffering;


      // Seperate Data Fetching
      function fetchTaskPrototypes(){
        var taskPrototypes = $wilddogObject(wilddog.$sync().ref("taskPrototypes"));
        taskPrototypes.$loaded().then(function () {
          angular.forEach(taskPrototypes, value, key, function(){

          })
        });
      }
      function fetchTodayStatus(){

      }

      function wilddogConfig(){
        //Wilddog Configuration
        var config = {
          //authDomain: "with-u-near.wilddogio.com",
          syncURL: "https://with-u-near.wilddogio.com"
        };
        wilddog.initializeApp(config);
        console.log("Wilddog in wilddog.js");
      }


      $scope.$on('$ionicView.loaded', function(e) { //.loaded, .enter, .leave
        //Life cycle : // http://www.gajotres.net/understanding-ionic-view-lifecycle/
        //TODO: Change it to Promise-based ajax
        wilddogConfig();
        $scope.dataBuffering(didDataBuffered);

      });

    })

    .controller('TaskDetailCtrl',function($scope,$stateParams){

    })

  .controller('SettingsCtrl',function($scope){
    $scope.set = {
      'Enable Daily Report': {
        expect: 'bool',
        value : true,
        default: true
      },
      'Tairokiya Have Not Finished his task...': {
        expect: 'bool',
        value : false,
        default: false
      },
       'Expect Daily Report Number': {
         expect: 'UInt',
         value: 5,
         default: 5,
       },
      'Enable Notification': {
        expect: 'bool',
        togglevalue: true,
        toggledefault: true,
        time: 1080,
        defaultTime: 1080
      }
    };
  })
  ;
