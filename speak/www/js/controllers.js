angular.module('starter.controllers', [])


.controller('RecordCtrl', ['$scope', '$interval', '$timeout', '$ionicPlatform', '$cordovaMedia', 'GUID', '$cordovaFile', '$cordovaFileTransfer', function($scope, $interval, $timeout, $ionicPlatform, $cordovaMedia, GUID, $cordovaFile, $cordovaFileTransfer) {
    var seconds = 0;
    var minutes = 0;
    var hours = 0;
    var t;
    $scope.textContent = "00:00:00";
    $scope.recordingNum = -1; //NUMBER OF RECORDINGS IN ONE LECTURE
    $scope.cordova = new Object();
		$scope.recordFileNames = [];
    var recordingID = GUID.get()
		var recorder;
    var mediaVar = null;
    var savePath;
    var fs = null;

		// status callback
		function audioRecordCallback() {
			return function (mediaStatus, error) {
				if (martinescu.Recorder.STATUS_ERROR == mediaStatus) {
					console.log(error);
				}
        $scope.status = mediaStatus
				console.log(mediaStatus);
			};
		}

		// buffer callback
		var bufferCallback = function (buffer) {
			//  console.log(buffer);
		}
		$scope.toggleRecord = function() {
			if ($scope.recording) {
				$timeout.cancel(t);
				recorder.stop();
				recorder.release();
        $scope.status = "STOPPED";
			} else {
					var fileName = recordingID + '-' + $scope.recordingNum  + ".wav";
					$scope.recordingNum++;
					createRecordFile(fileName, function(){
						$timeout(function () {
							timer();
							recorder.record();
						}, 200);
					});
			}
			$scope.recording = !$scope.recording;
		}

		$scope.playback = function() {
			/* stop();*/
			function playMedia(index) {
				playAudio($scope.recordFileNames[index].fileURL,
					function(index) {
						return function() {
							console.log(index);
							//ADD CONDITION HERE THAT WILL STOP PLAYING
							console.log($scope.recordFileNames[index].fileURL)
							if (index != $scope.recordingNum) playMedia(index + 1);
							else $scope.status = "STOPPED";
						};
					}(index), function(error){
						console.log(error);
					});
				}
				playMedia(0);
			}

		function createRecordFile(fileName, callback) {
			var type = window.PERSISTENT;
			var size = 5*1024*1024;
			window.requestFileSystem(type, size, createFileHelper(fileName), errorCallback)
			function createFileHelper(fileName) {
				return function successCallback(fs) {
					//savePath = fs.root.name;
					fs.root.getFile(fileName, {create: true, exclusive: true}, function(fileEntry) {
						console.log(fileEntry)
						console.log('File creation successfull!')
						var fileURL = "/" +fileEntry.nativeURL.split('///')[1];
						$scope.recordFileNames.push({fileName: fileName, fileURL: fileURL});
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
            $cordovaFile.removeFile($scope.recordFileNames[i].fileURL)
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

    $scope.save = function() {
        stop();
        //SEND FILES TO SERVER
        //CREATE NEW ID
        var count = 0;
        $scope.status = "SAVING";

        function send(index) {
            var options = { fileKey: "files", fileName: $scope.recordFileNames[index].fileName, mimeType: 'audio/mav', params: { lectureid: recordingID, current: index, total: $scope.recordingNum }, httpMethod: "POST" };
            console.log(options);
            $cordovaFileTransfer.upload('http://172.16.97.142:3000/upload', $scope.recordFileNames[index].fileURL, options)
                .then(function(result) {
                    console.log(result)
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
            send(i);
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

            /*
            $timeout(function() {
                // Modify the currently displayed notification
                cordova.plugins.backgroundMode.configure({
                    text: 'Running in background for more than 5s now.'
                });
            }, 5000);
            $interval(function() {
                cordova.plugins.backgroundMode.configure({
                    text: $scope.textContent
                });
            }, 1000)
			*/
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
}])

.controller('ClassesDetailsCtrl', function($scope) {
    $scope.files = [1, 2, 3, 4, 5, 6, 7];
})

.controller('ClassesListCtrl', function($scope, $ionicPlatform, $timeout, $state) {
    // All this stuf fis from speech recognition, we will not need it
    /*
    $scope.recognition = undefined;
    $scope.transcript = '';
    $scope.recognizing = false;
    $scope.loaded = false;
    $scope.toggleStartStop = function() {
        if ($scope.recognizing) {
            $scope.recognition.stop();
            $scope.reset();
        } else {
            $scope.recognition.start();
            $scope.recognizing = true;
            $scope.buttonHTML = "Click to Stop";
        }
    }
    $scope.reset = function() {
        $scope.recognizing = false;
        $scope.buttonHTML = "Click to Speak";
    }
    $ionicPlatform.ready(function() {
        $scope.recognition = new SpeechRecognition();
        $scope.recognition.continuous = true;
        $scope.recognition.onend = $scope.reset;
        $scope.loaded = true;
        $scope.reset();
        $scope.recognition.onresult = function(event) {
            if (event.results.length > 0) {
                $timeout(function() {
                    $scope.$apply(function() {
                        var final = "";
                        var interim = "";
                        console.log(event);
                        for (var i = 0; i < event.results.length; ++i) {
                            if (event.results[i].final) {
                                final += event.results[i][0].transcript;
                            } else {
                                interim += event.results[i][0].transcript;
                            }
                        }
                        $scope.finalSpan = final;
                        $scope.interimSpan = interim;
                    })
                });
            }
        };
    })
	*/
    /*********************************************/

    $scope.classes = [{
        class: 'ECE251',
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-251'
    }, {
        class: 'ECE151',
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-151'
    }, {
        class: 'ECE351',
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-351'
    }, {
        class: 'ECE451',
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-451'
    }]

    $scope.go2Details = function(index) {
        $state.go('tab.classes-details', { index: index })
    }

})

.controller('AccountCtrl', function($scope) {
    $scope.settings = {
        enableFriends: true
    };
})

.controller('welcomeCtrl', function($scope, $state) {
    $scope.go2Record = function() {
        $state.go('tab.record');
    }
})
