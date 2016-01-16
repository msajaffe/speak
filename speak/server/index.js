'use strict';

var watson = require('watson-developer-cloud');
var fs = require('fs-extra');
var express = require('express');
var multer = require('multer');

var speech_to_text = watson.speech_to_text({
  username: 'a368d1f4-6a55-4d9a-b848-707c5d078ca1',
  password: 'lFGo0nKzWNPr',
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api'
});

var params = {
  content_type: 'audio/wav'
};

// create the stream
var recognizeStream = speech_to_text.createRecognizeStream(params);

// pipe in some audio
//fs.createReadStream(__dirname + '/resources/61d3bc24-ca61-af70-39cd-145a6a9302c3-0.wav').pipe(recognizeStream);

// and pipe out the transcription
//recognizeStream.pipe(fs.createWriteStream('transcription.txt'));


// listen for 'data' events for just the final text
// listen for 'results' events to get the raw JSON with interim results, timings, etc.

recognizeStream.setEncoding('utf8'); // to get strings instead of Buffers from `data` events

['data', 'results', 'error', 'connection-close'].forEach(function(eventName) {
  recognizeStream.on(eventName, console.log.bind(console, eventName + ' event: '));
});

var app = express();
var upload = multer({ dest: './uploads' });

app.get('/', function(req, res){
  res.send('hello world');
});

app.post('/upload', function(req, res) {
    console.log(req.files);
});

app.listen(3030);
