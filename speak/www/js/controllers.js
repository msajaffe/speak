angular.module('starter.controllers', [])


.controller('RecordCtrl', ['$ionicPopup', '$scope', '$interval', '$timeout', '$ionicPlatform', '$cordovaMedia', 'GUID', '$cordovaFile', '$cordovaFileTransfer', 'dataFactory', '$localStorage',
    function($ionicPopup, $scope, $interval, $timeout, $ionicPlatform, $cordovaMedia, GUID, $cordovaFile, $cordovaFileTransfer, dataFactory, $localStorage) {


        $scope.$storage = $localStorage.classes;



        var seconds = 0;
        var minutes = 0;
        var hours = 0;
        var t;
        $scope.textContent = "00:00:00";
        $scope.recordingNum = -1; //NUMBER OF RECORDINGS IN ONE LECTURE
        $scope.cordova = {};
        $scope.recordFileNames = [];
        var recordingID = GUID.get()
        var recorder;
        var mediaVar = null;
        var savePath;
        var fs = null;

        // status callback
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

        $scope.toggleRecord = function() {
            if ($scope.recording) {
                $timeout.cancel(t);
                recorder.stop();
                recorder.release();
                $scope.status = "STOPPED";
            } else {
                var fileName = recordingID + '-' + $scope.recordingNum + ".wav";
                $scope.recordingNum++;
                createRecordFile(fileName, function() {
                    $timeout(function() {
                        timer();
                        recorder.record();
                    }, 200);
                });
            }
            $scope.recording = !$scope.recording;
        }




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

        $scope.clear = function() {
            var count = 0;
            $scope.status = "DELETING";
            //DELETE ALL FILES, RESET VARIABLES
            for (var i = 0; i < $scope.recordFileNames.length; i++) {
                var fileDir = $scope.recordFileNames[i].fileURL.split(recordingID)[0];
                console.log(fileDir);
                console.log($scope.recordFileNames[i].fileName);
                $cordovaFile.removeFile(fileDir, $scope.recordFileNames[i].fileName)
                    .then(function(result) {
                        console.log('Success: deleting audio file' + JSON.stringify(result));
                        count++;
                        if (count === $scope.recordFileNames.length) {
                            $scope.recordFileNames.length = 0;
                            count = 0;
                            $scope.textContent = "00:00:00";
                            seconds = 0;
                            minutes = 0;
                            hours = 0;
                            $scope.recordingNum = 0;
                            $scope.status = "STOPPED";
                        }
                    }, function(err) {
                        console.log('Error: deleting audio file' + JSON.stringify(err));
                    });
            }
        }

        $scope.save = function(classOption) {

            if (classOption) {
                var CLASS;
                for (var key in $scope.$storage) {
                    var name = $scope.$storage[key].class;
                    if (name === classOption)
                        CLASS = key;
                }

                stop();

                var count = 0;
                $scope.status = "SAVING";

                function send(index) {
                    var options = { fileKey: "files", fileName: $scope.recordFileNames[index].fileName, mimeType: 'audio/wav', params: { lectureid: recordingID, current: index, total: $scope.recordingNum }, httpMethod: "POST" };
                    console.log(options);
                    $cordovaFileTransfer.upload('https://boiling-inlet-4790.herokuapp.com/upload', $scope.recordFileNames[index].fileURL, options)
                        .then(function(result) {
                            alert(JSON.stringify(result));
                            count++;
                            if (count === $scope.recordFileNames.length) {
                                $scope.status = "STOPPED";
                            }
                            // Success!
                        }, function(err) {
                            console.log(err)
                            count++;
                            if (count === $scope.recordFileNames.length) {
                                $scope.status = "STOPPED";
                            }
                            // Error
                        }, function(progress) {
                            console.log(progress)
                                // constant progress updates
                        });
                }

                for (var i = 0; i < $scope.recordFileNames.length; i++) {
                    // send to the server
                    send(i);
                    $scope.$storage[CLASS].parts.push($scope.recordFileNames[i]);
                }
            } else {
                var myPopup = $ionicPopup.show({
                    templateUrl: 'templates/alert.html',
                    title: 'Please choose Class',
                    // subTitle: 'Please use normal things',
                    scope: $scope,
                    buttons: [{
                        text: '<b>Okey!</b>',
                        type: 'button-positive',
                        onTap: function(e) {}
                    }]
                });
            }
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

        function onStatusChange() {}

        function onSuccess() {}

        function onError(err) {
            console.log(err);
            if (typeof err.message != 'undefined')
                err = err.message;
            alert("Error : " + err);
        }

        function log(message) {
            console.info(message);
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

        $ionicPlatform.ready(function() {
            $scope.safeApply(function() {
                $scope.cordova.loaded = true;
            });
        });
    }
])

.controller('ClassesDetailsCtrl', function($scope, $localStorage, $stateParams, dataFactory, mediaFactory, $ionicModal) {
    $scope.details = $localStorage.classes[$stateParams.index];

    var initMedia = function(url) {
        var my_media = new Media(url,
            function() {},
            function() {},
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

.controller('ClassesListCtrl', function($ionicModal, $scope, $state, $localStorage, dataFactory, mediaFactory, $filter) {
    $scope.$storage = $localStorage.classes;
    $scope.files = $localStorage.audioFiles;

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
    $scope.go2 = navigationFactory.go2;



    $scope.createUser = function(userInfo) {
        if (userInfo.password === userInfo.password1)
            authFactory.createUser(userInfo);
        else $scope.message = 'please check your credentials.'
    }

    $scope.signinEmail = function(userInfo) {
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
