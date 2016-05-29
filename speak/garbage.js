return createMedia(
    function() {
        $scope.status = "playing";
        mediaVar.play().then(function(index) {
            return function() {
                console.log(index);
                //ADD CONDITION HERE THAT WILL STOP PLAYING
                if (index != $scope.recordingNum) playMedia(index + 1);
                else $scope.status = "stopped";
            };
        }(index));
    },
    null,
    index
);
