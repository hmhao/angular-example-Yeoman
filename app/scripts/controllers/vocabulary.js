'use strict';

angular.module('vocabulary', ['ngTable'])
    .factory('player', ['$document', '$rootScope', function ($document, $rootScope) {
        var audio = $document[0].createElement('audio');
        var player = {
            ready: false,
            current: null,
            progress: 0,
            progressPercent: 0,
            playing: false,

            play: function (word) {
                if (player.playing) {
                    player.stop();
                }
                audio.src = word.mp3;
                audio.play();
                player.playing = true;
            },
            stop: function () {
                if (player.playing) {
                    audio.pause();
                    player.playing = false;
                    player.current = null;
                }
            },
            currentTime: function () {
                return audio.currentTime;
            },
            currentDuration: function () {
                return parseInt(audio.duration);
            }
        };
        audio.addEventListener('timeupdate', function (evt) {
            $rootScope.$apply(function () {
                player.progress = player.currentTime();
                player.progressPercent = (player.progress / player.currentDuration()) * 100;
            });
        });
        audio.addEventListener('ended', function () {
            $rootScope.$apply(player.stop());
        });
        audio.addEventListener('canplay', function () {
            $rootScope.$apply(function () {
                player.ready = true;
            });
        });
        return player;
    }])
    .factory('vocService', ['$http', function ($http) {
        var doRequestVocabulary = function () {
            return $http({
                //method: 'JSONP',
                method: 'GET',
                url: 'datas/vocabulary/vocabulary.json'
            });
        };
        var doRequestSearch = function (word, type) {
            word = word || '';
            type = type || 'auto';
            return $http({
                method: 'GET',
                url: 'http://localhost:8080/api/v?q=' + word + '&type=' + type
            });
        }
        return {
            vocabulary: function () {
                return doRequestVocabulary();
            },
            search: function (word, type) {
                return doRequestSearch(word, type);
            }
        };
    }])
    .controller('VocabularyCtrl', ['$scope', 'vocService', 'player', function ($scope, vocService, player) {
        $scope.player = player;
        $scope.vocabulary ={};
        $scope.searchWord = '';
        $scope.search = function () {
            if($scope.vocabulary[$scope.searchWord]){
                return;
            }
            vocService.search($scope.searchWord)
                .success(function (data, status) {
                    if (data.word) {
                        $scope.vocabulary[data.word] = data;
                    }
                })
                .error(function (data, status) {
                });
        }
        vocService.vocabulary()
            .success(function (data, status) {
                $scope.vocabulary = {};
                angular.forEach(data, function (word) {
                    if (word.word) {
                        $scope.vocabulary[word.word] = word;
                    }
                });
            })
            .error(function (data, status) {
            });
    }])
    .controller('RelatedCtrl', ['$scope', 'player', function ($scope, player) {
        $scope.player = player;
        $scope.$watch('player.current', function (newWord) {
            if (newWord) {
                $scope.related = newWord.related;
                $scope.description = newWord.description;
            }
        });
    }])
    .directive('word', function () {
        return {
            restrict: 'EA',
            require: ['^ngModel'],
            replace: true,
            scope: {
                ngModel: '=',
                player: '=',
                spell: '&'
            },
            templateUrl: '/views/vocabulary/word-item.html',
            link: function (scope, ele, attr) {
                ele.on('click', function (evt) {
                    scope.$apply(function () {
                        scope.player.current = scope.ngModel;
                    });
                }).find('a').on('click', function () {
                    scope.player.play(scope.ngModel);
                });
            }
        };
    });
