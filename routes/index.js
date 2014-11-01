// Get access to our Watson module
var watson = require('./watson');


module.exports = function(app) {
    // index page 
    app.get('/', function(req, res) {
        res.render('index');
    });


	app.post('/question', watson.question);



// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login form
		app.get('/login', function(req, res) {
			res.render('login.ejs'/*, { message: req.flash('loginMessage') }*/);
		});

};


// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}