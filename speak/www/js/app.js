// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova', 'ngStorage', 'firebase', 'facebookModule'])

.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
        var config = {
            apiKey: "AIzaSyARGfA0hVJTX-IqVp5aHpBcop6BE-j-Nh0",
            authDomain: "speak-fea50.firebaseapp.com",
            databaseURL: "https://speak-fea50.firebaseio.com",
            storageBucket: "",
        };
        firebase.initializeApp(config);
    });
})

.config(['$ionicConfigProvider', function($ionicConfigProvider) {

    $ionicConfigProvider.tabs.position('bottom'); // other values: top

}])

.config(function($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

        .state('welcome', {
        url: '/welcome',
        templateUrl: 'templates/welcome.html',
        controller: 'welcomeCtrl'

    })

    // setup an abstract state for the tabs directive
    .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html'
    })

    // Each tab has its own nav history stack:

    .state('tab.record', {
        url: '/record',
        views: {
            'tab-record': {
                templateUrl: 'templates/tab-record.html',
                controller: 'Record2Ctrl'
            }
        }
    })

    .state('tab.classes-list', {
        url: '/classes-list',
        views: {
            'tab-classes': {
                templateUrl: 'templates/tab-classes-list.html',
                controller: 'ClassesListCtrl'
            }
        }
    })


    .state('tab.classes-details', {
        url: '/classes-details/:index',
        views: {
            'tab-classes': {
                templateUrl: 'templates/tab-classes-details.html',
                controller: 'ClassesDetailsCtrl'
            }
        }
    })


    .state('tab.account', {
        url: '/account',
        views: {
            'tab-account': {
                templateUrl: 'templates/tab-account.html',
                controller: 'AccountCtrl'
            }
        }
    })

    .state('tab.account-settings', {
        url: '/account-settings',
        views: {
            'tab-account': {
                templateUrl: 'templates/account-settings.html',
                controller: 'AccountSettingsCtrl'
            }
        }
    })

    .state('tab.account-storage', {
        url: '/account-storage',
        views: {
            'tab-account': {
                templateUrl: 'templates/account-storage.html',
                controller: 'AccountStorageCtrl'
            }
        }
    })




    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/record');


});
