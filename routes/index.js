module.exports = function(app) {
    // index page 
    app.get('/', function(req, res) {
        res.render('index');
    });

};


// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/');
}