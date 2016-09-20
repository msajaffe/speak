angular.module('starter.services', [])
    .factory('AuthenticationService', function($http, $state) {
        var serverURL = "http://192.168.10.235:3000/";
        var transcriptionURL = "https://speech.googleapis.com/v1beta1/speech:syncrecognize/"
        var tick = null;
        return {
            getURL: function() {
                return serverURL;
            },
            setURL: function(setURL) {
                serverURL = setURL;
            },
            getTicket: function() {
                return tick;
            },
            setTicket: function(ticket) {
                tick = ticket;
            },
            //REST API call to authenticate a user's credentials
            login: function(user, pass) {

            }
        };
    }).factory('LectureService', function($timeout) {
        var fileUrl;
        var fileEntry;
        var useMartinescu = false; //currently hardcoded to not use
        var self = this;
        var useAudioContextApi;
        var callbackManager;
        var status = "STOPPED"
        var volume, compressor, bandpassFilter;
        // martinescu: status callback
        function audioRecordCallback() {
            return function(mediaStatus, error) {
                if (martinescu.Recorder.STATUS_ERROR == mediaStatus) {
                    console.log(error);
                }
                self.status = mediaStatus
                console.log(mediaStatus);
            };
        }
        var bufferCallback = function(buffer) {
            // console.log(buffer);
        }

        function postRecognizerJob(message, callback) {

            var msg = message || {};

            if (self.callbackManager) {
                msg.callbackId = self.callbackManager.add(callback);
            }

            if (self.recognizer) {
                self.recognizer.postMessage(msg);
            }

        }

        function feedGrammar(g, index, id) {

            if (index < g.length) {

                postRecognizerJob({
                    command: 'addGrammar',
                    data: g[index].g
                }, function(id) {
                    feedGrammar(grammars, index + 1, {
                        id: id
                    });
                });

            } else {
                recognizerReady = true;
            }
        }

        var wordList = [
            ["ONE", "W AH N"],
            ["TWO", "T UW"],
            ["THREE", "TH R IY"],
            ["FOUR", "F AO R"],
            ["FIVE", "F AY V"],
            ["SIX", "S IH K S"],
            ["SEVEN", "S EH V AH N"],
            ["EIGHT", "EY T"],
            ["NINE", "N AY N"],
            ["ZERO", "Z IH R OW"],
            ["NEW-YORK", "N UW Y AO R K"],
            ["NEW-YORK-CITY", "N UW Y AO R K S IH T IY"],
            ["PARIS", "P AE R IH S"],
            ["PARIS(2)", "P EH R IH S"],
            ["SHANGHAI", "SH AE NG HH AY"],
            ["SAN-FRANCISCO", "S AE N F R AE N S IH S K OW"],
            ["LONDON", "L AH N D AH N"],
            ["BERLIN", "B ER L IH N"],
            ["SUCKS", "S AH K S"],
            ["ROCKS", "R AA K S"],
            ["IS", "IH Z"],
            ["NOT", "N AA T"],
            ["GOOD", "G IH D"],
            ["GOOD(2)", "G UH D"],
            ["GREAT", "G R EY T"],
            ["WINDOWS", "W IH N D OW Z"],
            ["LINUX", "L IH N AH K S"],
            ["UNIX", "Y UW N IH K S"],
            ["MAC", "M AE K"],
            ["AND", "AE N D"],
            ["AND(2)", "AH N D"],
            ["O", "OW"],
            ["S", "EH S"],
            ["X", "EH K S"]
        ];

        var grammars = [{
            g: {
                numStates: 1,
                start: 0,
                end: 0,
                transitions: [{
                    from: 0,
                    to: 0,
                    word: "ONE"
                }, {
                    from: 0,
                    to: 0,
                    word: "TWO"
                }, {
                    from: 0,
                    to: 0,
                    word: "THREE"
                }, {
                    from: 0,
                    to: 0,
                    word: "FOUR"
                }, {
                    from: 0,
                    to: 0,
                    word: "FIVE"
                }, {
                    from: 0,
                    to: 0,
                    word: "SIX"
                }, {
                    from: 0,
                    to: 0,
                    word: "SEVEN"
                }, {
                    from: 0,
                    to: 0,
                    word: "EIGHT"
                }, {
                    from: 0,
                    to: 0,
                    word: "NINE"
                }, {
                    from: 0,
                    to: 0,
                    word: "ZERO"
                }]
            }
        }];

        return {
            getTranscription: function(callback) {
                $http({
                    method: 'POST',
                    url: serverURL + '/uploadLecture',
                    headers: { 'authticket': '123' } //moar
                }).then(function successCallback(msg) {
                    console.log(msg);
                    callback();
                }, function failCallback(msg) {
                    console.log(msg);
                });
            },
            Set: function(params) {
                self.fileUrl = params.fileUrls
                self.fileEntry = params.fileEntry;
                console.log("SoundRecorder set with fileUrl: " + params.fileUrl);
            },
            // method to tell if SoundRecorder is using Web Audio API
            UsingWebAudioApi: function() {
                return self.useAudioContextApi;
            },
            // method to start the recording
            Record: function() {
                if (self.useAudioContextApi) {
                    // use the AudioContextApi
                    self.status = "RECORDING";
                    self.recorder.clear();
                    self.recorder.record();
                } else {
                    // use the Martinescu Sound Recorder
                    self.recorder.record();
                }
            },
            // method to stop the recording
            Stop: function() {
                if (self.useAudioContextApi) {
                    // use the AudioContextApi
                    function buffersCallback(buffers) {
                        // encode as WAV and save to file
                        self.recorder.exportWAV(saveSoundFile);
                    }

                    function saveSoundFile(blob) {
                        var src = blob;
                        var startTime = Date.now();
                        self.fileEntry.createWriter(
                            function(fileWriter) {
                                fileWriter.onwriteend = function(event) {
                                    // TODO: investigate why this does not work
                                    // update status to enable the play button
                                    self.status = "STOPPED";
                                    // usually 3-6 seconds lockup
                                    console.log("done writing WAV file in milliseconds:");
                                    console.log(Date.now() - startTime);

                                };
                                fileWriter.write(src);
                            },
                            function(err) {
                                console.log("Failed saving wav file. Error: " + err);
                                self.status = "STOPPED";
                            }
                        );
                    };

                    self.volume && self.volume.disconnect();
                    self.compressor && self.compressor.disconnect();
                    self.bandpassFilter && self.bandpassFilter.disconnect();

                    self.recorder.stop();
                    //    self.recorder.getBuffers(buffersCallback);
                    // workaround for the TODO in onwriteend above
                    $timeout(function() {
                        self.status = "STOPPED";
                    }, 3000);
                } else {
                    // use the Martinescu Sound Recorder
                    self.recorder.stop();
                    self.recorder.release();
                    self.status = "STOPPED";
                }
            },
            setupFilters: function(stream) {
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
                self.recognizer = new Worker("js/pocketsphinx-web/recognizer.js");
                self.callbackManager = new CallbackManager();
                if (self.useMartinescu !== true && contextClass && navigator && navigator.getUserMedia) {
                    // sound manipulation filters for input stream
                    console.log("Web Audio API (Audio Context) is available.");
                    self.status = "INITIALIZING";
                    self.useAudioContextApi = true;
                    var bufferSize = 16384; // number of samples to collect before analyzing raw adio
                    // use the AudioContextApi
                    console.log("Using Audio Context API.");

                    var context = new contextClass();
                    var input = context.createMediaStreamSource(stream);
                    var dest = context.createMediaStreamDestination();
                    javascript_node = context.createScriptProcessor(bufferSize, 1, 1);
                    self.compressor = context.createDynamicsCompressor();

                    self.volume = context.createGain();
                    self.volume.gain.value = 5;
                    self.volume.connect(self.compressor);

                    self.bandpassFilter = context.createBiquadFilter();
                    self.bandpassFilter.type = 'bandpass';
                    self.bandpassFilter.Q.value = 8.30;
                    self.bandpassFilter.frequency.value = 355;
                    self.bandpassFilter.connect(self.volume);

                    input.connect(self.volume);
                    self.compressor.connect(dest);

                    // setup the analyzer node
                    analyser = context.createAnalyser();
                    analyser.smoothingTimeConstant = 0.0;
                    analyser.fftSize = 1024; // must be power of two

                    // connect the nodes together
                    analyser.connect(javascript_node);
                    javascript_node.connect(context.destination);

                    // allocate the freq data array
                    array = new Uint8Array(analyser.frequencyBinCount);
                    console.log(array);

                    //var config = {bufferLen: bufferSize};
                    //self.recorder = new Recorder(output, config);
                    //using the same matt diamond recorder api but reconciled to match with pocketsphinx
                    var config = { inputBufferLength: bufferSize, outputSampleRate: 44100 };
                    var output = context.createMediaStreamSource(dest.stream);
                    self.recorder = new AudioRecorder(output, config);

                    if (self.recognizer) {
                        console.log("RECOGNISER IS GUCCI")
                        self.recorder.consumers = [self.recognizer];
                    }
                    console.log("Recorder started successfully.");
                    self.status = "READY";


                    self.recognizer.onmessage = function() {

                        // I need this nested event listener because the first time a message is triggered we need to trigger other things that we never need to trigger again
                        self.recognizer.onmessage = function(e) {

                            // if an id to be used with the callback manager
                            // this is needed to start the listening
                            if (e.data.hasOwnProperty('id')) {

                                var data = {};

                                if (e.data.hasOwnProperty('data')) {
                                    data = e.data.data;
                                }

                                var callback = self.callbackManager.get(e.data['id']);

                                if (callback) {
                                    callback(data);
                                }

                            }

                            // if a new hypothesis has been created
                            if (e.data.hasOwnProperty('hyp')) {

                                var hypothesis = e.data.hyp;

                                console.log(hypothesis);


                            }

                            // if an error occured
                            if (e.data.hasOwnProperty('status') && (e.data.status == "error")) {

                            }

                        };

                        // Once the worker is fully loaded, we can call the initialize function
                        // You can pass parameters to the recognizer, such as : {command: 'initialize', data: [["-hmm", "my_model"], ["-fwdflat", "no"]]}
                        postRecognizerJob({
                            command: 'initialize'
                        }, function() {

                            if (self.recorder) {
                                self.recorder.consumers = [self.recognizer];
                            }

                            postRecognizerJob({
                                command: 'addWords',
                                data: wordList
                            }, function() {
                                feedGrammar(grammars, 0);

                                //    startRecording();

                            });

                        });

                    };

                    self.recognizer.postMessage('');

                } else {
                    if (self.useMartinescu) {
                        console.log("Option overriding to use Martinescu library for sound recording.");
                    } else {
                        console.log("Web Audio API (Audio Context) is NOT available.");
                        console.log("Install Crosswalk WebView plugin below and rebuild the code:");
                        console.log("$ cordova plugin add cordova-plugin-crosswalk-webview");
                    }
                    self.useAudioContextApi = false;
                }
            }
        };
    }).factory('GUID', function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return {
            get: function() {
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            }
        };
    })

.factory('navigationFactory', function($state) {

    var service = {};

    service.go2 = function(state) {
        switch (state) {
            case 0:
                $state.go('tab.record')
                break;
            case 1:
                $state.go('tab.classes-list')
                break;
            case 2:
                $state.go('tab.notes')
                break;
            case 3:
                $state.go('tab.themes')
                break;
            case 4:
                $state.go('tab.account')
                break;
            case 5:
                $state.go('tab.settings')
                break;
        }

    }

    return service;
})

.factory('dataFactory', function($localStorage) {

    var service = {};

    service.classes = [{
        class: 'Numercial Methods 2',
        coursecode: 'ECE204B',
        id: 1,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-251'
    }, {
        class: 'Advanced Calculus 2',
        coursecode: 'ECE206',
        id: 2,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-151'
    }, {
        class: 'Embedded Microprocessor Systems',
        coursecode: 'ECE224',
        id: 3,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-351'
    }, {
        class: 'Operating Systems and Systems Programming',
        coursecode: 'ECE254',
        id: 4,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-351'
    }, {
        class: 'Electrical Properties of Materials',
        coursecode: 'ECE209',
        id: 5,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-351'
    }]

    service.getAllClasses = function() {
        return $localStorage.classes;
    };
    service.addClass = function(element) {
        $localStorage.classes.push(element);
    }
    service.removeClass = function(element) {
        $localStorage.classes.splice($localStorage.classes.indexOf(element), 1);
    }

    service.add2System = function(audioFile) {
        if (!$localStorage.audioFiles)
            $localStorage.audioFiles = [];
        $localStorage.audioFiles.push(audioFile)
    }

    if (!$localStorage.classes)
        $localStorage.classes = [];


    return service;
})

.factory('firebaseFactory', function($q) {

    var ref = firebase.database().ref();
    var storageRef = firebase.storage().ref();

    var service = {};

    service.uploadFile = function(file) {
        var deferred = $q.defer();
        var uploadTask = storageRef.child('audioFiles/' + file.name).put(file);
        uploadTask.on('state_changed', function(snapshot) {
            console.log('progress');
        }, function(error) {
            console.log('pause');
        }, function() {
            console.log('done');
            var downloadURL = uploadTask.snapshot.downloadURL;
            deferred.resolve(downloadURL);
        });
        return deferred.promise;
    }

    return service;

})


.factory('mediaFactory', function($timeout) {

    var service = {};

    // mediaFactory.playAudio
    function playAudio(url, successCallback, errorCallback) {
        // Play the audio file at url
        var my_media = new Media(url,
            successCallback,
            errorCallback
        );
        // Play audio
        my_media.play();
        $timeout(function() {
            my_media.pause()
        }, 5000)
    }

    service.playMedia = function(fileURL) {
        playAudio(fileURL,
            function() {
                console.log('I just played a file');
            },
            function(error) {
                console.log(error);
            });
    }

    return service;
})

.factory('authFactory', function($state, $q, $timeout, $ionicLoading, $ionicPlatform, $cordovaFacebook) {

    var service = {};

    service.createUser = function(userInfo) {

        firebase.auth().createUserWithEmailAndPassword(userInfo.email, userInfo.password)
            .catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
            });
    }

    service.signinEmail = function(userInfo) {
        var deferred = $q.defer();
        firebase.auth().signInWithEmailAndPassword(userInfo.email, userInfo.password)
            .then(function() {
                deferred.resolve(true);
            })
            .catch(function(error) {
                // Handle Errors here.
                deferred.resolve(error)
                var errorCode = error.code;
                var errorMessage = error.message;
                // ...
            });
        return deferred.promise;
    }

    service.signout = function() {
        firebase.auth().signOut()
            .then(function() {
                // Sign-out successful.
            }, function(error) {
                // An error happened.
            });
    }

    $ionicPlatform.ready(function() {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                service.user = user;
                $state.go('tab.record');
            } else {
                service.user = null;
                $state.go('welcome');
            }

        });
    })

    service.signinFacebook = function() {
        $cordovaFacebook.login(["public_profile", "email", "user_friends"])
            .then(function(success) {
                console.log(sucess);
            }, function(error) {
                console.log(error);
            });
    }


    return service;
})
