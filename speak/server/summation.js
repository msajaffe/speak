function SummationController($scope, $http) {
     //input
     $scope.title = "";
     $scope.original_text = "";

     $scope.original_document = [];
     $scope.summarized_document = [];
     $scope.summary = "";


     $scope.summarize = function() {
          if($scope.original_text == "") {
               console.log("Error: Summation text was blank");
               return;
          }

          original_text_copy = $scope.original_text;

          while(original_text_copy != "") {
               i = original_text_copy.indexOf('.');  //improvement: you can't just break off at periods. some sentences end off in: !, ?, etc
               if(i == -1) {
                    break;
               }

               sentence = original_text_copy.substring(0,i+1);
               original_text_copy = original_text_copy.substring(i+1);
               $scope.original_document.push(sentence);
          }

          console.log('Doc length: ' + $scope.original_document.length);
          summaries = [];
          summaries.push($scope.sentenceLengthSummarizer($scope.original_document));
          summaries.push($scope.similarityToTitleSummarizer($scope.title, $scope.original_document));
          //$scope.summary = $scope.mainConceptsSummarizer($scope.original_document);
          summaries.push($scope.uniquenessSummarizer($scope.original_text));
          $scope.summary = $scope.combineSummaries($scope.original_document.length, summaries);
          console.log("done");
     }

     //=========================================================================

     $scope.getSentenceFrequencies = function(summaries)  {
          summary = [];
          frequencies = [];
          final_summary = [];

          for(var i=0; i<summaries.length; ++i) {
               for(var j=0; j<summaries[i].length; ++j) {
                    exists = false;
                    for(var k=0; k<summary.length; ++k) {
                         if(summaries[i][j] == summary[k]) {
                              exists = true;
                              break;
                         }
                    }

                    if(!exists)
                         summary.push(summaries[i][j]);
               }
          }

          for(var i=0; i<summary.length; ++i) {
               for(var j=0; j<summaries.length; ++j) {
                    for(var k=0; k<summaries[j].length; ++k) {
                         if(summary[i] == summaries[j][k]) {
                              if(frequencies[i]==undefined)
                                   frequencies[i] = 0;
                              frequencies[i]++;
                         }
                    }
               }
          }

          return {"summary" : summary, "frequencies" : frequencies};
     }

     $scope.combineSummaries = function(original_doc_length, summary_sets) {
          //the higher the occurence of a sentence across various summary sets means it the higher the
          fsummary = [];
          frequencies = $scope.getSentenceFrequencies(summary_sets);

          while(fsummary.length <= 15) { //change to the desired summary length
               highest_frequency = 0;
               highest_frequency_index = 0;

               for(var i=0; i<frequencies.frequencies.length; ++i) {
                    if(frequencies.frequencies[i] >= highest_frequency) {
                         highest_frequency = frequencies.frequencies[i];
                         highest_frequency_index = i;
                    }
               }

               frequencies.frequencies.splice(highest_frequency_index, 1);
               fsummary.push(frequencies.summary[highest_frequency_index]);
          }

          return fsummary;
     }

     //=========================================================================

     String.prototype.count=function(c) {
          var result = 0, i = 0;
          for(i;i<this.length;i++)if(this[i]==c)result++;
          return result;
     };

     $scope.sentenceLengthSummarizer = function (doc) {
          var summary = [];
          var longest_sentence_index = 0;
          var longest_sentence_words = 0;
          var sentence = "";
          var words = 0;
          var ratio = 0;

          for (var i=0; i<doc.length; ++i) {
               sentence = doc[i];
               words = sentence.count(" ") + 1;
               if(words >= longest_sentence_words) {
                    longest_sentence_words = words;
                    longest_sentence_index = i;
               }
          }

          for (var i=0; i<doc.length; ++i) {
               sentence = doc[i];
               words = sentence.count(" ") + 1;
               ratio = words/longest_sentence_words;
               if(ratio >= 0.5) { //may need to change this later? play with this to yield the best result.
                    summary.push(sentence);
               }
          }

          return summary;
     }

     //=========================================================================

     //improve this by getting rid of useless words in the titles
     $scope.similarityToTitleSummarizer = function (title, doc) {
          var summary = [];
          var title_key_words = title.split(" ");
          var sentence = [];

          for(var i=0; i<doc.length; ++i) {
               sentence = doc[i];
               for(var j=0; j<title_key_words.length; ++j) {
                    if(sentence.indexOf(title_key_words[j]) != -1) {
                         summary.push(sentence);
                    }
               }
          }

          return summary.filter(function(item, pos) {
               return summary.indexOf(item) == pos;
          })
     }

     //=========================================================================

     $scope.mainConceptsSummarizer = function() {
          summary = [];
          $http.get('http://localhost:8080/mainConceptsSummarizer',{"original_text": $scope.original_text, "doc": $scope.original_document}).success(function(data){
               console.log("Data we got back is: " + data);
               summary = data;
          });
          return summary;
     }

     //=========================================================================
     $scope.getFrequecies = function(string) {
          var cleanString = string.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,""),
               words = cleanString.split(' '),
               frequencies = {},
               word, frequency, i;

          for( i=0; i<words.length; i++ ) {
               word = words[i];
               frequencies[word] = frequencies[word] || 0;
               frequencies[word]++;
          }

          words = Object.keys( frequencies );
          return words.sort(function (a,b) { return frequencies[b] -frequencies[a];}).toString();
     }

     //improve this by removing useless words like (this, in, that, he, ...) [using WordPOS] from the unique words & then instead of adding sentences with the lowest frequencies add sentences with the highest frequencies
     $scope.uniquenessSummarizer = function(doc) {
          summary = [];
          most_frequent_items = $scope.getFrequecies(doc);
          for(var i=0; i<$scope.original_document.length; ++i) {
               for(var j=most_frequent_items.length-1; j>=(most_frequent_items.length/2); --j) { //try half for now and experiement with it to see if there's a better value to go with
                    if($scope.original_document[i].indexOf(most_frequent_items[j]) != -1) {
                         summary.push($scope.original_document[i]);
                         break;
                    }
               }
          }
          return summary;
     }

     //=========================================================================
}
