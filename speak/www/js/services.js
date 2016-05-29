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

.factory('dataFactory', function() {

    var service = {};

    service.classes = [{
        class: 'ECE251',
        id: 1,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-251'
    }, {
        class: 'ECE151',
        id: 2,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-151'
    }, {
        class: 'ECE351',
        id: 3,
        start_time: new Date().getTime(),
        end_time: new Date().getTime(),
        file: 'link-351'
    }]

    return service;
})
