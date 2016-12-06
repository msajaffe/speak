angular.module('starter.controllers', [])


.controller('Record2Ctrl', ['$ionicPopup', '$scope', '$interval', '$timeout', '$ionicPlatform', '$cordovaMedia', 'GUID', '$cordovaFile', '$cordovaFileTransfer', 'dataFactory', '$localStorage', 'LectureService',

function($ionicPopup, $scope, $interval, $timeout, $ionicPlatform, $cordovaMedia, GUID, $cordovaFile, $cordovaFileTransfer, dataFactory, $localStorage, LectureService) {

  $scope.$storage = $localStorage.classes;
  $scope.textContent = "00:00:00";
  $scope.recordingNum = -1; //NUMBER OF RECORDINGS IN ONE LECTURE
  $scope.cordova = {};
  $scope.recordFileNames = [];
  $scope.soundRecorder;
  $scope.recording = 'start';
  $scope.status = "INITIALIZING"
  var seconds = 0;
  var minutes = 0;
  var hours = 0;
  var t;
  var recordingID = GUID.get()
  var mediaVar = null;
  var savePath;
  var fs = null;
  $scope.recognizedText = '';

  $scope.safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  $scope.recorder = function () {
    var recognition = new webkitSpeechRecognition();
    var recording = false;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onend = function() {  console.log("CAS onend");
    recording = false;
    //  recognition.stop();
    //  if (!recording) return;
    //  recognition.start();
  };
  recognition.onerror 		= function() {  console.log("CAS onerror");   	};
  recognition.onstart = function(){ recording = true; }
  recognition.onresult = function(event) {
    console.log(event);
    $scope.interim_transcript = '';
    if (typeof(event.results) == 'undefined') {
      recognition.onend = null;
      recognition.stop();
      upgrade();
      return;
    }
    if (event.results.length > 0) {
      $scope.final_transcript = event.results[0][0].transcript;
      $scope.safeApply();
    }

    for (var i = event.resultIndex; i < event.results.length; ++i) {
      console.log(event.results[i])
      if (event.results[i].final) {
        $scope.final_transcript += event.results[i][0].transcript;
      } else {
        $scope.interim_transcript += event.results[i][0].transcript;
      }
      $scope.safeApply();
    }
  };

  recognition.audiostart = function(event) {
    console.log(event);
  };

  return {
    record : function() {
      console.log("I GOT HERE")
      recording = true;
      recognition.start();
    },
    stopRecord : function() {
      recording = false;
      recognition.stop();
    }
  };
};

$scope.toggleRecord = function() {
  //  $scope.soundRecorder = LectureService;
  if ($scope.recording === 'start') {
    $scope.soundRecorder = $scope.LectureService;
    navigator.getUserMedia({audio:true},
      $scope.soundRecorder.SetupFilters,
      function (err) {
        console.log("Error getting user media: " + err);
        $scope.soundRecorder.useAudioContextApi = false;
      });
      $scope.recording = false;
    }
    if ($scope.recording) {
      $timeout.cancel(t);
      //$scope.soundRecorder.stopRecord();
      if ($scope.soundRecorder) $scope.soundRecorder.Stop();
      //else console.log("RECORDING FAILED")
    } else {
      console.log("NIGGER");
      var fileName = recordingID + '-' + $scope.recordingNum + ".wav";
      $scope.recordingNum++;
      //  $scope.soundRecorder.record();
      createRecordFile(fileName,
        function() {
          timer();
          if ($scope.status == "READY") $scope.soundRecorder.Record(); //$scope.soundRecorder.Record();
          else console.log("RECORDING FAILED")
        }
      );
    }
    $scope.recording = !$scope.recording;
  }

  function createRecordFile(fileName, callback) {
    var type = window.PERSISTENT;
    var size = 5 * 1024 * 1024;
    window.requestFileSystem(type, size, createFileHelper(fileName), errorCallback);

    function createFileHelper(fileName) {
      return function successCallback(fs) {
        //savePath = fs.root.name;
        fs.root.getFile(fileName, { create: true, exclusive: true }, function(fileEntry) {
          console.log(fileEntry)
          console.log('File creation successfull!')
          var fileURL = "/" + fileEntry.nativeURL.split('///')[1];
          $scope.recordFileNames.push({ fileName: fileName, fileURL: fileURL, create_at: new Date().getTime() });
          console.log(fileEntry.nativeURL.split('///')[1]);
          if ($scope.soundRecorder && $scope.soundRecorder.UsingWebAudioApi()) {
            // When using AudioContext, only need to create it once.
            $scope.status = "INITIALIZING";
            var params = {fileUrl: fileURL, fileEntry: fileEntry};
            $scope.soundRecorder.Set(params);
            $scope.status = "READY";
          } else {
            var options = {fileUrl: fileURL, fileEntry: fileEntry};
            // uncomment this line if you want to use Martinescu library
            //options.useMartinescu = true;
            $scope.soundRecorder.Set(options);
          }
          if (typeof callback === 'function') {
            callback();
          }
        }, errorCallback);
      };
    }

    function errorCallback(error) {
      console.log(error);
      alert("ERROR: " + error.code)
    }
  }


  // the plugin for notifications
  document.addEventListener('deviceready', function() {
    // Android customization
    cordova.plugins.backgroundMode.setDefaults({
      title: 'Speak it up!',
      text: 'Doing heavy tasks.'
    });

    // Enable background mode
    cordova.plugins.backgroundMode.enable();
    // Called when background mode has been activated
    cordova.plugins.backgroundMode.onactivate = function() {
      cordova.plugins.backgroundMode.configure({
        text: $scope.status
      });
    }
  }, false);

  function add() {
    seconds++;
    if (seconds >= 60) {
      seconds = 0;
      minutes++;
      if (minutes >= 60) {
        minutes = 0;
        hours++;
      }
    }
    $scope.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);
    timer();
  }

  function timer() {
    t = $timeout(add, 1000);
  }

  $scope.getStatus = function(){
    return $scope.status;
  };

}
])

.controller('ClassesDetailsCtrl', function($scope, $localStorage, $stateParams, dataFactory, mediaFactory, $ionicModal) {
  $scope.details = $localStorage.classes[$stateParams.index];

  var initMedia = function(url) {
    var my_media = new Media(url,
      function() {
        console.log('in success')
      },
      function(MediaError) {
        console.log(MediaError)
      },
      function(status) {
        $scope.state = status;
        if (status == 4 && $scope.media.INDEX) {
          $scope.play[$scope.media.INDEX] = false;
        }
      }
    );
    return my_media;
  }


  var startMedia = function(index) {
    $scope.media = initMedia($scope.details.parts[index].fileURL);
    $scope.media.INDEX = index;
    $scope.media.play();
  }

  var pauseMedia = function() {
    $scope.media.pause();
  }

  var resumeMedia = function() {
    $scope.media.play();
  }

  $scope.play = [];

  $scope.manageMedia = function(index) {
    if ($scope.media) {
      if (index == $scope.media.INDEX) {
        switch ($scope.state) {
          case Media.MEDIA_NONE:
          {
            $scope.play[index] = false
            break;
          }
          case Media.MEDIA_STARTING:
          {
            $scope.play[index] = true;
            break;
          }
          case Media.MEDIA_RUNNING:
          {
            $scope.play[index] = false;
            pauseMedia();
            break;
          }
          case Media.MEDIA_PAUSED:
          {
            $scope.play[index] = true;
            resumeMedia();
            break;
          }
          case Media.MEDIA_STOPPED:
          {
            $scope.play[index] = true;
            resumeMedia();
            break;
          }
        }

      } else {
        $scope.media.release();
        $scope.play[$scope.media.INDEX] = false;
        $scope.play[index] = true;
        startMedia(index);
      }
    } else {
      startMedia(index);
      $scope.play[index] = true;
    }
  }


})

.service('utilitiesService', function(facebookProfileService) {

  var service = {};

  service.colors = [
    { code: '#ED5564' },
    { code: '#EC87BF' },
    { code: '#5C9DED' },
    { code: '#47CEC0' },
    { code: '#42CB6F' }
  ]


  return service;

})

.controller('ClassesListCtrl', function(facebookProfileService, $ionicModal, $scope, $state, $localStorage, dataFactory, mediaFactory, $filter, utilitiesService) {

  // facebook tests
  $scope.facebookPost = function() {
    facebookProfileService.facebookPost();
  }


  $scope.$storage = $localStorage.classes;
  $scope.files = $localStorage.audioFiles;

  var colors = utilitiesService.colors;

  $ionicModal.fromTemplateUrl('templates/new-class-modal.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.createClassModal = modal;
  });

  $scope.playMedia = mediaFactory.playMedia;

  $scope.go2Details = function(index) {
    $state.go('tab.classes-details', { index: index })
  }

  $scope.createClass = function(item) {
    item.parts = [];
    item.created_at = new Date().getTime()
    item.color = colors[item.color].code;

    var name = item.class;
    var result = $filter('filter')($scope.$storage, name, false, 'class')
    if (result[0])
    $scope.message = 'this class already exists';
    else {
      $scope.message = '';
      $scope.$storage.push(item);
    }
    $scope.createClassModal.hide();
  }

})


.controller('AccountCtrl', function($scope, $state, authFactory) {
  $scope.go2Settings = function() {
    $state.go('tab.account-settings');
  }

  $scope.go2FileStorage = function() {
    $state.go('tab.account-storage');
  }

  $scope.signout = authFactory.signout;
})

.controller('welcomeCtrl', function($scope, $state, navigationFactory, authFactory, $ionicPlatform) {
  //  $scope.go2 = navigationFactory.go2;

  $scope.newUser = {};
  $scope.active = 0;

  $scope.signin = function(method) {
    console.log('signin in with ' + method)
    if (method == 'facebook') { authFactory.signinFacebook(); }
  }

  $scope.signupsignin = function(userInfo, active) {
    if (active == 1) {
      createUser(userInfo);
    } else {
      signinEmail(userInfo);
    }
  }

  var createUser = function(userInfo) {
    if (userInfo.password === userInfo.password1)
    authFactory.createUser(userInfo);
    else $scope.message = 'please check your credentials.'
  }

  var signinEmail = function(userInfo) {
    authFactory.signinEmail(userInfo).then(function(res) {
      if (res.message) {
        $scope.message = res.message;
      }

    });
  }

})

.controller('AccountSettingsCtrl', function() {

})

.controller('AccountStorageCtrl', function() {

})
