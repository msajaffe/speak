angular.module('starter.controllers', [])


.controller('Record2Ctrl', ['$ionicPopup', '$scope', '$interval', '$timeout', '$ionicPlatform', '$cordovaMedia', 'GUID', '$cordovaFile', '$cordovaFileTransfer', 'dataFactory', '$localStorage', 'LectureService',

function($ionicPopup, $scope, $interval, $timeout, $ionicPlatform, $cordovaMedia, GUID, $cordovaFile, $cordovaFileTransfer, dataFactory, $localStorage, LectureService) {

  $scope.$storage = $localStorage.classes;

  var seconds = 0;
  var minutes = 0;
  var hours = 0;
  var t;
  $scope.textContent = "00:00:00";
  $scope.recordingNum = -1; //NUMBER OF RECORDINGS IN ONE LECTURE
  $scope.cordova = {};
  $scope.recordFileNames = [];
  $scope.transcription = "";
  $scope.summary = "";
  var recordingID = GUID.get()
  var recorder;
  var mediaVar = null;
  var savePath;
  var fs = null;

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

  function getTranscriptionFromResponse(response) {
    var words = response.words;
    var transcript = "";
    for (var word in words){
      transcript += word.name + " ";
    }
    return transcript;
  }

  function download(time, jobId) {
    $timeout(
      function () {
        LectureService.downloadTranscript(jobId, function(response){
          if (response.status == 404) download(time*5, jobId);
          else if (response.status == 200) {
            //save transcription with lecture ID in class
            $scope.transcription = getTranscriptionFromResponse(response.data);
            $scope.summary = LectureService.summarizeLecture($scope.transcription);
          }
        });
      },
      time
    );
  }

  $scope.toggleRecord = function() {
    //var lol = "Wednesday, a Kremlin spokesman said the document was a fabrication and total nonsense. Spokesman Dmitry Peskov said Russia had no compromising material on President-elect Donald Trump or his opponent, Hillary Clinton, and that the document was a hoax intended to further damage U.S.-Russian relations. Trump has scheduled a news conference for Wednesday — his first since one in July in which he quipped that Russia should hack materials related to his Democratic opponent, Hillary Clinton. The alleged intelligence document appears likely to dominate the upcoming session. NPR is not detailing the contents of the brief because it remains unverified, but it describes a concerted effort by Russian President Vladimir Putin to cultivate a relationship with Trump and his camp. The document, which describes information provided by Russian government and other sources, details behavior by Trump that could leave him open to blackmail, as well as alleged secret meetings between Trump aides and Russian officials called to discuss the campaign against Clinton and potential new business relationships.";
    //console.log(LectureService.summarizeLecture(lol));
    if ($scope.recording) {
      $timeout.cancel(t);
      recorder.stop();
      recorder.release();
      $scope.status = "STOPPED";

      LectureService.transcribe($scope.recordFileNames[$scope.recordingNum].fileURL,
        $scope.recordFileNames[$scope.recordingNum].fileName,
        function(jobId) {
          //callback should send the transcription to summarization library
          download(1000, jobId);
        });

        /*
        LectureService.downloadTranscript("1439532", function(transcription){
        $scope.transcription = transcription;
      });*/
    } else {
      $scope.recordingNum++;
      var fileName = recordingID + '-' + $scope.recordingNum + ".wav";
      createRecordFile(fileName, function() {
        $timeout(function() {
          timer();
        }, 100);
        recorder.record();
      });
    }
    $scope.recording = !$scope.recording;
  }

  function audioRecordCallback() {
    return function(mediaStatus, error) {
      if (martinescu.Recorder.STATUS_ERROR == mediaStatus) {
        console.log(error);
      }
      $scope.status = mediaStatus
      console.log(mediaStatus);
    };
  }

  // buffer callback
  var bufferCallback = function(buffer) {
    //  console.log(buffer);
  }

  function createRecordFile(fileName, callback) {
    var type = window.PERSISTENT;
    var size = 5 * 1024 * 1024;
    window.requestFileSystem(type, size, createFileHelper(fileName), errorCallback)

    function createFileHelper(fileName) {
      return function successCallback(fs) {
        //savePath = fs.root.name;
        fs.root.getFile(fileName, { create: true, exclusive: true }, function(fileEntry) {
          console.log(fileEntry)
          console.log('File creation successfull!')
          var fileURL = "/" + fileEntry.nativeURL.split('///')[1];
          //var fileURL = "/" + fileName;
          console.log(fileURL)
          $scope.recordFileNames.push({ fileName: fileName, fileURL: fileURL, create_at: new Date().getTime() });
          console.log(fileEntry.nativeURL.split('///')[1]);
          recorder = new martinescu.Recorder(fileURL, { sampleRate: 44100 }, audioRecordCallback(), bufferCallback);
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
    /*
    // Enable background mode
    cordova.plugins.backgroundMode.enable();
    // Called when background mode has been activated
    cordova.plugins.backgroundMode.onactivate = function() {
    cordova.plugins.backgroundMode.configure({
    text: $scope.status
    });
    }
    */
  }, false);

  $scope.playback = function() {
    function playMedia(index) {
      playAudio($scope.recordFileNames[index].fileURL,
        function(index) {
          return function() {
            if (index != $scope.recordingNum) playMedia(index + 1);
            else $scope.status = "STOPPED";
          };
        }(index),
        function(error) {
          console.log(error);
        });
      }
      // stop();
      playMedia(0);
    }

    function playAudio(url, successCallback, errorCallback) {
      // Play the audio file at url
      var my_media = new Media(url,
        successCallback,
        errorCallback
      );
      // Play audio
      my_media.play();
    }

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
