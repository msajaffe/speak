angular.module('starter.controllers', [])


.controller('RecordCtrl', ['$scope', '$timeout', '$ionicPlatform', '$cordovaMedia', function($scope, $timeout, $ionicPlatform, $cordovaMedia) {
	var seconds = 0; var minutes = 0; var hours = 0; var t; $scope.textContent = "00:00:00";
	$scope.cordova = new Object();
	var mediaVar = null;
	var recordFileName = "recording1.wav";

	function stop() {
		if (status == 'recording') {
			mediaVar.stopRecord();
			log("Recording stopped");
		}
		else if (status == 'playing') {
			mediaVar.stop();
			log("Play stopped");
		}
		else {
			log("Nothing stopped");
		}
		status = 'stopped';
	}
	function record() {
		if (mediaVar != null) {
			mediaVar.release();
			mediaVar = null;
		}
		createMedia(function() {
			status = "recording";
			mediaVar.startRecord();
		}, onStatusChange);
	}
	$scope.toggleRecord = function() {
		if ($scope.recording){
			$timeout.cancel(t);
			stop();
		} else {
			timer();
			record();
		}
		$scope.recording = !$scope.recording;
	}
	$scope.playback = function() {
		createMedia(function(){
			status = "playing";
			mediaVar = $cordovaMedia.newMedia('/sdcard/'+recordFileName, function(){
				log("Media created successfully");
			}, onError);
			mediaVar.play();
		});
	}
	function createMedia(onMediaCreated, mediaStatusCallback) {
		if (mediaVar != null) {
			console.log("OKAY");
			onMediaCreated();
			return;
		}
		if (typeof mediaStatusCallback == 'undefined') mediaStatusCallback = null;
		mediaVar = $cordovaMedia.newMedia(recordFileName, function(){
			log("Media created successfully");
		}, onError, mediaStatusCallback);
		onMediaCreated();
	}

  function onStatusChange(){}
	function onSuccess(){}
	function onError(err) {
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
	$scope.clear = function() {
		$scope.textContent = "00:00:00";
		seconds = 0; minutes = 0; hours = 0;
	}
	$scope.safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') {
			if(fn && (typeof(fn) === 'function')) {
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

.controller('ClassesCtrl', function($scope) {
	// With the new view caching in Ionic, Controllers are only called
	// when they are recreated or on app start, instead of every page change.
	// To listen for when this page is active (for example, to refresh data),
	// listen for the $ionicView.enter event:
	//
	//$scope.$on('$ionicView.enter', function(e) {
	//});
	/*
	$scope.chats = Chats.all();
	$scope.remove = function(chat) {
	Chats.remove(chat);
};*/
})
/*
.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
$scope.chat = Chats.get($stateParams.chatId);
})
*/
.controller('AccountCtrl', function($scope) {
	$scope.settings = {
		enableFriends: true
	};
});
