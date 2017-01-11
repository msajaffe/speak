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
    //REST API call to authenticate a user's credentials
    login: function(user, pass) {

    }
  };
})
.factory('Summarizer', function() {
  var retVal = {}
  retVal.Utility = {};

  // Get text from an HTML document.
  retVal.Utility.getTextFromHtml = function (someHtmlDoc) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = someHtmlDoc;
    return tmp.textContent || tmp.innerText;
  }

  // Get sentences from text.
  retVal.Utility.getSentences = function (text) {
    var sentences = text.split(/\. |\.|\?|!|\n/g);
    $(sentences).each(function (idx) {
      sentences[idx] = $.trim(sentences[idx]);
    });
    sentences = $(sentences).filter(function (idx) {
      return sentences[idx].length > 0;
    });
    return sentences;
  }

  // Calculate similarity between 2 sentences.
  retVal.Utility.calculateSimilarity = function (sentence1, sentence2) {
    var words1 = sentence1.split(" ");
    var words2 = sentence2.split(" ");
    var intersection = _.intersection(words1, words2);
    var sumOfLengths = Math.log(words1.length) + Math.log(words2.length);
    if (sumOfLengths == 0) {
      return 0;
    } else {
      return intersection.length / sumOfLengths; // JS uses floating point arithmetic by default.
    }
  }

  // Make directed graph.
  retVal.Utility.makeGraph = function (sentences) {
    var graph = {};
    for (var idx1 = 0; idx1 < sentences.length; ++idx1) {
      for (var idx2 = idx1 + 1; idx2 < sentences.length; ++idx2) {
        if (graph[idx1] == undefined) {
          graph[idx1] = [];
        }

        if (graph[idx2] == undefined) {
          graph[idx2] = [];
        }
        var similarityScore = retVal.Utility.calculateSimilarity(
          sentences[idx1], sentences[idx2]);
          graph[idx1].push({
            "node": idx2,
            "weight": similarityScore
          });
          graph[idx2].push({
            "node": idx1,
            "weight": similarityScore
          });
        }
      }
      // Inculde a lookup from the sentenceId to the actual sentence.
      graph.sentenceIdLookup = sentences;
      return graph;
    }

    // Page Rank calculation driver.
    retVal.Utility.calculatePageRank = function (graph, maxIterations,
      dampingFactor, delta) {
        var pageRankStruct = {};
        var totalWeight = {};
        var totalNumNodes = graph.sentenceIdLookup.length; // Number of nodes.
        for (var idx = 0; idx < totalNumNodes; ++idx) {
          pageRankStruct[idx] = {
            "oldPR": 1.0,
            "newPR": 0.0
          };
          totalWeight[idx] = 0.0;
        }
        for (var idx = 0; idx < totalNumNodes; ++idx) {
          var adjacencyList = graph[idx];
          if (adjacencyList == undefined) {
            continue;
          }
          // The adjacency list is an array containg objects that contain the neighbours' index as
          // key and similarity score as the weight.
          _.each(adjacencyList, function (item) {
            totalWeight[idx] += item["weight"];
          });
        }
        var converged = false;
        for (var iter = 0; iter < maxIterations; ++iter) {
          maxPRChange = retVal.Utility.runPageRankOnce(graph, pageRankStruct,
            totalWeight, totalNumNodes, dampingFactor);
            if (maxPRChange <= (delta / totalNumNodes)) {
              converged = true;
              break;
            }
          }
          var pageRankResults = {};
          for (var idx = 0; idx < totalNumNodes; ++idx) {
            pageRankResults[idx] = {
              "PR": pageRankStruct[idx]["oldPR"] / totalNumNodes,
              "sentence": graph.sentenceIdLookup[idx]
            };
          }
          return pageRankResults;
        }


        // Single iteration of Page Rank.
        retVal.Utility.runPageRankOnce = function (graph, pageRankStruct,
          totalWeight, totalNumNodes, dampingFactor) {
            var sinkContrib = 0.0;
            for (var idx = 0; idx < totalNumNodes; ++idx) {
              if (graph[idx] == undefined || graph[idx].length == 0) {
                // Sink.
                sinkContrib += pageRankStruct[idx]["oldPR"];
                continue;
              }
              var wt = 0.0;
              // Now iterate over all the nodes that are pointing to this node.
              _.each(graph[idx], function (adjNode) {
                var node = adjNode["node"];
                // Get the total weight shared by this adjacent node and its neighbours.
                var sharedWt = totalWeight[node];
                if (sharedWt != 0) { // To prevent NaN
                  wt += (adjNode["weight"] / sharedWt) * pageRankStruct[node]["oldPR"];
                }
              });
              wt *= dampingFactor;
              wt += (1 - dampingFactor);
              // Update the structure w/ the new PR.
              pageRankStruct[idx]["newPR"] = wt;
            }
            // Apply the sink contrib overall.
            sinkContrib /= totalNumNodes;
            var max_pr_change = 0.0;
            for (var idx = 0; idx < totalNumNodes; ++idx) {
              pageRankStruct[idx]["newPR"] += sinkContrib;
              // Report back the max PR change.
              var change = Math.abs(pageRankStruct[idx]["newPR"] - pageRankStruct[idx][
                "oldPR"
              ]);
              if (change > max_pr_change) {
                max_pr_change = change;
              }
              // Set old PR to new PR for next iteration.
              pageRankStruct[idx]["oldPR"] = pageRankStruct[idx]["newPR"];
              pageRankStruct[idx]["newPR"] = 0.0;
            }
            return max_pr_change;
          }
          return retVal;
        })
        .factory('LectureService', function($cordovaFileTransfer, $http, Summarizer) {

          return {
            transcribe: function(fileDirectory, fileName, callback) {
              //API CALL: Upload file for transcription.
              var jobId = "15222";
              var lang = "en-US";
              var authToken = "ZmEzYzEwMDgtYmQ0MC00OGQyLWFkZDAtNmY2ZGMwOTlkMzdj";
              var transcriptCallback = "https://www.google.ca";
              var apiUploadURL = 'https://api.speechmatics.com/v1.0/user/' + jobId + '/jobs/?auth_token=' + authToken;
              var formData = {
                diarisation: 'true',
                model: lang,
                notification: 'callback',
                callback: transcriptCallback
              }

              var options = { fileKey: "data_file", fileName: fileName, mimeType: 'audio/wav', params: formData, httpMethod: "POST" };
              console.log(options);
              $cordovaFileTransfer.upload(apiUploadURL, fileDirectory, options)
              .then(function (success) {
                console.log(success);
                var id = success.response.split('"id":')[1].replace(/\D/g, '');
                callback(id);
              }, function (error) {
                console.log(error);
              });
            },
            downloadTranscript: function(jobId, callback){
              var apiDownloadURL = "https://api.speechmatics.com/v1.0/user/15222/jobs/" + jobId + "/transcript?auth_token=ZmEzYzEwMDgtYmQ0MC00OGQyLWFkZDAtNmY2ZGMwOTlkMzdj";
              $http({
                method: 'GET',
                url: apiDownloadURL
              }).then(function (resp) {
                console.log(resp);
                callback(resp);
              }, function (error) {
                console.log(error);
                callback(error);
              });
            },
            summarizeLecture: function(inputText){
              // Configure this object for tweaking summarization params.
              var configObj = {
                "maxIter": 100,
                "dampingFactor": 0.85,
                "delta": 0.5
              };
              var outputText = "";
              var inputToSummarize = $.trim(inputText);
              if (inputToSummarize.length == 0) {
                outputText = "No text to be summarized...";
              } else {
                // Invoke the summarizer algo.
                var sentences = Summarizer.Utility.getSentences(inputToSummarize);
                var graph = Summarizer.Utility.makeGraph(sentences);
                var result = Summarizer.Utility.calculatePageRank(graph, configObj.maxIter,
                  configObj.dampingFactor, configObj.delta);

                  var arr = [];
                  var idx = 0;
                  _.each(result, function (v, k) {
                    arr.push({
                      "sentence": v.sentence,
                      "PR": v.PR,
                      "idx": idx++
                    });
                    console.log("sentence: " + v.sentence + ", PR: " + v.PR);
                  });

                  // Sort in descending order of PR.
                  arr = arr.sort(function (a, b) {
                    return b.PR - a.PR;
                  });

                  // Just returning half the original number of lines.
                  var halfNumLines = Math.floor(arr.length / 2);
                  if (halfNumLines == 0) {
                    halfNumLines = arr.length;
                  }

                  // Collect the half number of lines and sort them according to their occurence in the original text.
                  arr = arr.splice(0, halfNumLines);
                  arr = arr.sort(function (a, b) {
                    return a.idx - b.idx;
                  });
                  var finalResult = "";
                  for (var idx = 0; idx < halfNumLines; ++idx) {
                    finalResult += arr[idx].sentence + ". ";
                  }
                  outputText = finalResult;
                }
                return outputText;
              }
            }
          })
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
              firebase
              .auth().signInWithEmailAndPassword(userInfo.email, userInfo.password)
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

              // if the person is just signing in.
              $cordovaFacebook.login(["public_profile", "email", "user_friends"])
              .then(function(success) {
                console.log(success.authResponse.accessToken);
                var credential = firebase.auth.FacebookAuthProvider.credential(success.authResponse.accessToken);
                firebase.auth().signInWithCredential(credential).catch(function(error) {
                  // Handle Errors here.
                  var errorCode = error.code;
                  var errorMessage = error.message;
                  // The email of the user's account used.
                  var email = error.email;
                  // The firebase.auth.AuthCredential type that was used.
                  var credential = error.credential;

                });
              }, function(error) {
                console.log(error);
              });
            }


            return service;
          })
