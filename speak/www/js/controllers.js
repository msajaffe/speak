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
        var soundRecorder;
        var mediaVar = null;
        var savePath;
        var fs = null;

        $scope.toggleRecord = function() {
            if ($scope.recording) {
                $timeout.cancel(t);
                soundRecorder.Stop();
            } else {
                var fileName = recordingID + '-' + $scope.recordingNum + ".wav";
                $scope.recordingNum++;
                createRecordFile(fileName, function() {
                    $timeout(function() {
                        timer();
                        soundRecorder.Record();
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
                        if (soundRecorder && soundRecorder.UsingWebAudioApi()) {
                            // When using AudioContext, only need to create it once.
                            $scope.status = "INITIALIZING";
                            var params = {fileUrl: fileURL, fileEntry: fileEntry};
                            soundRecorder.Set(params);
                            $scope.status = "READY";
                        } else {
                            var options = {fileUrl: fileURL, fileEntry: fileEntry};
                            // uncomment this line if you want to use Martinescu library
                            //options.useMartinescu = true;
                            soundRecorder = new SoundRecorder(options);
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
            // playback using AudioContext API with possible sound enhancement
            var contextClass = (window.AudioContext ||
                                window.webkitAudioContext ||
                                window.mozAudioContext ||
                                window.oAudioContext ||
                                window.msAudioContext);
            if (contextClass) {
                console.log("Web Audio API (Audio Context) is available.");

                // Web Audio API is available.
                var context = new contextClass();
                var source = context.createBufferSource();
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                request.responseType = 'arraybuffer';
                request.onload = function(){
                    console.log("onLoad of: " + url);
                    context.decodeAudioData(request.response, function(buffer) {
                        source.buffer = buffer;
                    }, null);
                }
                request.send();
                source.connect(context.destination);
                source.start(0);

                /*
                // test with sound manipulation playback: comment out source.start(0) above
                // and uncomment this block
                var filter, compressor;
                compressor = context.createDynamicsCompressor();
                compressor.threshold.value = -50;
                compressor.knee.value = 40;
                compressor.ratio.value = 12;
                compressor.reduction.value = -20;
                compressor.attack.value = 0;
                compressor.release.value = 0.25;

                filter = context.createBiquadFilter();
                filter.Q.value = 8.30;
                filter.frequency.value = 355;
                filter.gain.value = 3.0;
                filter.type = 'bandpass';

                source.connect(filter);
                filter.connect(compressor);
                compressor.connect(context.destination)

                console.log("playing source");
                source.start(0);
                */
            } else {
                // Web Audio API (AudioContext) is not available
                console.log("Web Audio API (AudioContext) is not available.  Use Media to play back.");

                // Play the audio file at url
                var my_media = new Media(url, successCallback, errorCallback);
                my_media.play();
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


        // ------------------------------------------------------------------------
        // Everything about the Sound Recorder is in this block for encapsulation.
        // There are two Sound Recorders:
        // 1) Martinescu with Java calls.
        // 2) RecorderJS with AudioContext API provides on-the-fly sound
        //    manipulation for higher sound quality.
        // The second Sound Recorder may not be available on some phones.
        // Thus, the code will automatically use the first Sound Recorder (martinescu)
        // as fallback.
        //
        // SoundRecorder options:
        // - fileUrl <required> : file URL
        // - fileEntry <required> : system file entry
        // - useMartinescu <optional boolean> : true to use Martinescu
        //
        // TODO: after everything is well tested, move this block of code encapsulation
        // into a separate js file to keep the controllers.js short.
        //

        function SoundRecorder (options) {

            var self = this;
            this.fileUrl = options.fileUrl;
            this.fileEntry = options.fileEntry;
            this.useMartinescu = options.useMartinescu;
            console.log("SoundRecorder created with fileUrl: " + options.fileUrl);

            // With Web Audio API, re-use the Audio Context and just change params
            // set params: fileUrl and fileEntry
            this.Set = function (params) {
                this.fileUrl = params.fileUrl;
                this.fileEntry = params.fileEntry;
                console.log("SoundRecorder set with fileUrl: " + params.fileUrl);
            };

            // martinescu: status callback
            function audioRecordCallback () {
                return function(mediaStatus, error) {
                    if (martinescu.Recorder.STATUS_ERROR == mediaStatus) {
                        console.log(error);
                    }
                    $scope.status = mediaStatus
                    console.log(mediaStatus);
                };
            }
            // martinescu: buffer callback
            var bufferCallback = function (buffer) {
                // console.log(buffer);
            }

            // check AudioContext API availability
            var contextClass = (window.AudioContext ||
                                window.webkitAudioContext ||
                                window.mozAudioContext ||
                                window.oAudioContext ||
                                window.msAudioContext);
            if (navigator) {
                navigator.getUserMedia = (navigator.getUserMedia ||
                                          navigator.webkitGetUserMedia ||
                                          navigator.mozGetUserMedia ||
                                          navigator.msGetUserMedia);
            }

            var volume, compressor, bandpassFilter;
            if (this.useMartinescu !== true && contextClass && navigator && navigator.getUserMedia) {
                console.log("Web Audio API (Audio Context) is available.");
                $scope.status = "INITIALIZING";
                this.useAudioContextApi = true;

                // sound manipulation filters for input stream
                function SetupFilters (stream) {
                    // use the AudioContextApi
                    console.log("Using Audio Context API.");

                    var context = new contextClass();
                    var input = context.createMediaStreamSource(stream);
                    var dest = context.createMediaStreamDestination();

                    compressor = context.createDynamicsCompressor();

                    volume = context.createGain();
                    volume.gain.value = 5;
                    volume.connect(compressor);

                    bandpassFilter = context.createBiquadFilter();
                    bandpassFilter.type = 'bandpass';
                    bandpassFilter.Q.value = 8.30;
                    bandpassFilter.frequency.value = 355;
                    bandpassFilter.connect(volume);

                    input.connect(volume);
                    compressor.connect(dest);

                    // playback test while recording
                    //dest.connect(context.destination);

                    var output = context.createMediaStreamSource(dest.stream);
                    var bufferSize = 16384;
                    var config = {bufferLen: bufferSize};
                    self.recorder = new Recorder(output, config);
                    console.log("Recorder started successfully.");
                    $scope.status = "READY";
                }

                navigator.getUserMedia({audio:true},
                                       SetupFilters,
                                       function (err) {
                                          console.log("Error getting user media: " + err);
                                          self.useAudioContextApi = false;
                                      });

            } else {
                if (this.useMartinescu) {
                    console.log("Option overriding to use Martinescu library for sound recording.");
                } else {
                    console.log("Web Audio API (Audio Context) is NOT available.");
                    console.log("Install Crosswalk WebView plugin below and rebuild the code:");
                    console.log("$ cordova plugin add cordova-plugin-crosswalk-webview");
                }
                this.useAudioContextApi = false;
            }

            if (!this.useAudioContextApi) {
                // use the Martinescu Sound Recorder
                console.log("Using Martinescu Sound Recorder.");
                this.recorder = new martinescu.Recorder(options.fileUrl,
                                                        {sampleRate: 44100},
                                                        audioRecordCallback(),
                                                        bufferCallback);
            }

            // method to tell if SoundRecorder is using Web Audio API
            this.UsingWebAudioApi = function () {
                return this.useAudioContextApi;
            }

            // method to start the recording
            this.Record = function () {
                if (this.useAudioContextApi) {
                    // use the AudioContextApi
                    $scope.status = "RECORDING";
                    this.recorder.clear();
                    this.recorder.record();

                } else {
                    // use the Martinescu Sound Recorder
                    this.recorder.record();
                }
            };

            // method to stop the recording
            this.Stop = function () {
                if (this.useAudioContextApi) {
                    // use the AudioContextApi
                    function buffersCallback (buffers) {
                        // encode as WAV and save to file
                        self.recorder.exportWAV(saveSoundFile);
                    }
                    function saveSoundFile (blob) {
                        var src = blob;
                        var startTime = Date.now();
                        self.fileEntry.createWriter(
                            function (fileWriter) {
                                fileWriter.onwriteend = function (event) {
                                    // TODO: investigate why this does not work
                                    // update status to enable the play button
                                    $scope.status = "STOPPED";
                                    // usually 3-6 seconds lockup
                                    console.log("done writing WAV file in milliseconds:");
                                    console.log(Date.now() - startTime);

                                };
                                fileWriter.write(src);
                            }, 
                            function (err) {
                                console.log("Failed saving wav file. Error: " + err);
                                $scope.status = "STOPPED";
                            }
                        );
                    };

                    volume && volume.disconnect();
                    compressor && compressor.disconnect();
                    bandpassFilter && bandpassFilter.disconnect();

                    this.recorder.stop();    
                    this.recorder.getBuffers(buffersCallback);
                    // workaround for the TODO in onwriteend above
                    $timeout(function() {
                        $scope.status = "STOPPED";
                    }, 3000);
                } else {
                    // use the Martinescu Sound Recorder
                    this.recorder.stop();
                    this.recorder.release();
                    $scope.status = "STOPPED";
                }
            };

        };

        //
        // End Of Sound Recorder Encapsulation
        // ------------------------------------------------------------------------


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
