
// Module dependencies
var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();

// Set the server port
app.set('port', process.env.PORT || 3001);
app.use(express.bodyParser());



// Expose static web page resources
app.use("/", express.static(__dirname + '/public'));


////////////

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file


require('./routes/index.js')(app);







// Get access to our Watson module
var watson = require('./watson/watson');
// Set up RESTful resources
// POST requests to /question are handled by ‘watson.question’
app.post('/question', watson.question);

// Start the http server
http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
