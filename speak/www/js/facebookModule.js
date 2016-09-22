angular.module('facebookModule', ['ngCordova'])

.service('facebookProfileService', function($cordovaFacebook, $q) {

    var service = {};

    var getProfile = function() {

    }

    service.getLoginStatus = function() {

        var deferred = $q.defer();

        $cordovaFacebook.getLoginStatus()
            .then(function(success) {
                deferred.resolve(success);
            }, function(error) {
                deferred.resolve(error)
            });

        return deferred.promise;
    }


    service.facebookPost = function() {

        let deferred = $q.defer();

        let options = {
            method: "feed",
            link: "http://example.com",
            caption: "Such caption, very feed."
        };
        $cordovaFacebook.showDialog(options)
            .then(function(success) {
                deferred.resolve(success);
            }, function(error) {
                deferred.resolve(error);
            });

        return deferred.promise;

    }


    service.getFacebook = function(info) {
        info = 'me/friends';
        let deferred = $q.defer();
        $cordovaFacebook.api(info, ["public_profile"])
            .then(function(success) {
                deferred.resolve(success);
            }, function(error) {
                deferred.resolve(error);
            });

        return deferred.promise;
    }



    /*


    $cordovaFacebook.getAccessToken()
        .then(function(success) {
            // success
        }, function(error) {
            // error
        });

    $cordovaFacebook.logout()
        .then(function(success) {
            // success
        }, function(error) {
            // error
        });


    */




    return service;

})
