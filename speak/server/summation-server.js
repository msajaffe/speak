var express = require('express');
var WordPOS = require('wordpos');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(8080, function () {
  console.log('Listening on port 8080!');
});

var findFrequencies = function(targets, doc) {
     var freq = [];
     for(var i=0; i<targets.length; ++i) {
          freq.push(doc.count(targets[i])); //note if you search for "is" in a sentence it will still count "this" as part of it
     }
     return freq;
}

app.get('/mainConceptsSummarizer',function(res,req){
     wordpos = new WordPOS();
     nouns = [];
     main_concepts = [];
     wordpos.getNouns(req.params.original_text, function(result) {nouns = result;});

     if(nouns.length > 15) {
          noun_freq = findFrequencies(nouns, req.params.original_text);
          noun_f = new Array();
          for(var i=0; i<noun_freq.length; ++i) {
               noun_f.push({noun: nouns[i], freq: noun_freq[i]});
          }
          noun_f.sort(function(a,b) {
              return a.val - b.val;
          });

          for(var i=0; i<15; ++i) {
               main_concepts.push(Object.keys(noun_f)[i]);
          }
     } else {
          main_concepts = nouns;
     }

     for(var i=0; i<req.params.doc.length; ++i) {
          for(var j=0; j<main_concepts.length; ++j) {
               if(req.params.doc[i].indexOf(main_concepts[j]) != -1) {
                    summary.push(req.params.doc[i]);
               }
          }
     }

     res.send(summary);
});
