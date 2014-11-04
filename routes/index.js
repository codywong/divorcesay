// Get access to our Watson module
var watson = require('./watson');


module.exports = function(app, passport) {

	// pass path to view
	app.use(function(req, res, next){
	  res.locals.path = req.path;
	  res.locals.loggedIn = req.isAuthenticated()
	  next();
	});    

	// home page 
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

	// discounts page 
    app.get('/discounts', function(req, res) {
        res.render('discounts');
    });

	// discounts page 
    app.get('/history', watson.fetchHistory);

    // link questions associated with session to current user login
    app.get('/link', watson.linkHistory);

    // process watson question
	app.post('/question', watson.question);

	// process signup form
	app.post('/signup', passport.authenticate('local-signup', {
	        successRedirect : '/link', // redirect to the secure profile section
	        failureRedirect : '/signup', // redirect back to the signup page if there is an error
	        failureFlash : true // allow flash messages
    }));

	// process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
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