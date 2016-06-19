function summarize(unsummarized_text) {
    var lexrank = require('lexrank');
    lexrank.summarize(unsummarized_text, 10, function (error, toplines, text) {
        if(!error) {
          console.log("original text: " + unsummarized_text);
          console.log("toplines: " + toplines);
          console.log("text: " + text);
        }
    });
}
