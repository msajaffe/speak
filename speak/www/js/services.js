angular.module('starter.services', [])

.factory('GUID', function() {
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
