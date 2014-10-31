
// Module dependencies
var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();

// Set the server port
app.set('port', process.env.PORT || 3001);

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Expose static web page resources
app.use("/", express.static(__dirname + '/public'));

// Get access to our Watson module
var watson = require('./watson/watson');
// Set up RESTful resources
// POST requests to /question are handled by ‘watson.question’
app.post('/question', watson.question);

// Start the http server
http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
