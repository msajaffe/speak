angular.module('starter.services', [])
.factory('AuthenticationService', function($http, $state) {
  var serverURL = "http://192.168.10.235:3000/";
  var transcriptionURL = "https://speech.googleapis.com/v1beta1/speech:syncrecognize/"
  var tick = null;
  return {
    getURL : function(){
      return serverURL;
    },
    setURL : function(setURL){
      serverURL = setURL;
    },
    getTicket : function(){
      return tick;
    },
    setTicket: function(ticket){
      tick = ticket;
    },
    //REST API call to authenticate a user's credentials
    login: function(user, pass){

    }
  };
}).factory('LectureService', function (){
  return {
     getTranscription: function(callback) {
      $http({
        method: 'POST',
        url: serverURL + '/uploadLecture',
        headers: {'authticket': '123'} //moar
      }).then(function successCallback(msg) {
        console.log(msg);
        callback();
      }, function failCallback(msg) {
        console.log(msg);
      });
    },
    setupFilters: function (stream) {
       // sound manipulation filters for input stream
       var volume, compressor, bandpassFilter;
       console.log("Web Audio API (Audio Context) is available.");
       this.status = "INITIALIZING";
       this.useAudioContextApi = true;
       var bufferSize = 16384; // number of samples to collect before analyzing raw adio
       // use the AudioContextApi
       console.log("Using Audio Context API.");

       var context = new contextClass();
       var input = context.createMediaStreamSource(stream);
       var dest = context.createMediaStreamDestination();
       javascript_node = context.createScriptProcessor(bufferSize, 1, 1);
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
       var config = {inputBufferLength: bufferSize, outputSampleRate: 44100};
       self.recorder = new AudioRecorder(output, config);

       var output = context.createMediaStreamSource(dest.stream);
       if (self.recognizer) {
         self.recorder.consumers = [self.recognizer];
       }
       console.log("Recorder started successfully.");
       self.status = "READY";
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
        coursecode:'ECE204B',
        id: 1,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-251'
    }, {
        class:'Advanced Calculus 2',
        coursecode: 'ECE206',
        id: 2,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-151'
    }, {
        class:'Embedded Microprocessor Systems',
        coursecode: 'ECE224',
        id: 3,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-351'
    },{
        class:'Operating Systems and Systems Programming',
        coursecode: 'ECE254',
        id: 4,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-351'
    },{
        class:'Electrical Properties of Materials',
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

.factory('authFactory', function($state, $q, $timeout, $ionicLoading, $ionicPlatform) {

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


    return service;
})
