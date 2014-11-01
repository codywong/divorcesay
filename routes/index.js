// Get access to our Watson module
var watson = require('./watson');


module.exports = function(app, passport) {
    
	// Home page 
    app.get('/', function(req, res) {
        res.render('index');
    });

	// log in
	app.get('/login', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});


	// sign up
	app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

	// profile
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user
		});
	});

	// logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});



    // process watson question
	app.post('/question', watson.question);

	// process signup form
	app.post('/signup', passport.authenticate('local-signup', {
	        successRedirect : '/profile', // redirect to the secure profile section
	        failureRedirect : '/signup', // redirect back to the signup page if there is an error
	        failureFlash : true // allow flash messages
	    }));

	// process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

};


// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}