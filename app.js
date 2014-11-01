
// Module dependencies =========================================================
var express = require('express');
var app = express();
var port = process.env.PORT || 3001;

var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');


// configuration ===============================================================

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static(__dirname + '/public')); // expose static resources

app.set('view engine', 'ejs'); // set the view engine to ejs


// routes ======================================================================
require('./routes/index.js')(app);


// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database


app.listen(port);
console.log('The magic happens on port ' + port);