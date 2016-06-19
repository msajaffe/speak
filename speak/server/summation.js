function summarize(unsummarized_text) {
    var lexrank = require('lexrank');
    lexrank.summarize(unsummarized_text, 10, function (error, toplines, text) {
        if(!error) {
          console.log("original text: " + unsummarized_text);
          console.log("toplines: " + toplines);
          console.log("text: " + text);
        }
    });

    //TODO:
    //[1] - ensure that the unsummarized_text will be given in a string
    //[2] - determine the correct file format that you will output to
    //[3] - improve the lexrank algorithm by either adding to it or rewriting/modifying it with Machine Learning princples to improve our summation. (if we are trying to sell people on our summation technology we need to set our focus on that)
}
