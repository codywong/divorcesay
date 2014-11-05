// Watson related code - queries, and storing question and answers

var credentials = require('../config/credentials');
var Result      = require('../models/results');

// Describe the Watson Endpoint
// Specify the information and credentials pertinent to your Watson instance
var endpoint = {
    // enter watson host name; e.g: 'http://www.myhost.com'
    host : 'https://watson-wdc01.ihost.com',
    
    // enter watson instance name; e.g: '/deepqa/v1/question'
    instance : '/instance/507/deepqa/v1/question',
    
    // enter authentication info; e.g: 'Basic c29tZXVzZXJpZDpzb21lcGFzc3dvcmQ='
    auth : credentials.auth
};


// Handler for /question POST requests
// Submits a question to Watson via the IBM Watson QAAPI
// and returns the QAAPI response.
exports.question = function(req, res) {
	if (!endpoint.host) {
		res.send(404, 'Watson host information not supplied.');
	}
    var uri = endpoint.host + endpoint.instance;
    var request = require("request");
    
    // Form a proper Watson QAAPI request
    var questionEntity = {
        "question" : {
            "evidenceRequest": {
            "items": 1
            },
            "items"        : 1,
            "questionText" : req.body.question // The question
        }
    };

    console.log('Ask Watson: ' + req.body.question + ' @ ' + uri);

    // Invoke the IBM Watson QAAPI Synchronously 
    // POST the questionEntity and handle the QAAPI response
    request({
        'uri' : uri,
        'method' : "POST",
        'headers' : {
            'Content-Type' : 'application/json;charset=utf-8',
            'X-SyncTimeout' : 30,
            'Authorization' : endpoint.auth
        },
        'json' : questionEntity,

    }, function(error, response, body) {

        // store question and answer (by userid if possible, or by sessionid)

        var newResult = new Result();
        newResult.question  = body.question.questionText;
        newResult.answer    = JSON.stringify(body.question.evidencelist);

        // if user is logged in, store their userid, otherwise, store sessionid
        if (req.user) {
            newResult.user = req.user.id;
        }
        else {
            newResult.sessionID = req.session.id;
        }


        // save the result
        newResult.save(function(err) {
            if (err)
                throw err;
        });

        // get suggestions for personalised ads and questions
        body.suggestions = suggestedContent(body.question.questionText);

        console.log(body);
        // Return the QAAPI response in the entity body
        res.json(body);


    });
}

exports.fetchHistory = function(req, res) {

    // find previous results associated to account
    if (req.isAuthenticated()) {
        Result.find({user: req.user}, null, {sort: {created_at: 'desc'}}, 
            function(err, searches){
                
                res.render('history', {
                    results : searches
                });

        });
    }
    else { // user is not logged on, find results based on sessionID
        Result.find({sessionID: req.session.id, user : { $exists: false }}, null
            , {sort: {created_at: 'desc'}}, function(err, searches){
                
                res.render('history', {
                    results : searches
                });

        });
    }
}

exports.linkHistory = function(req, res) {

    // // link past questions asked to their newly created account
    if (req.isAuthenticated()) {
        Result.update({sessionID: req.session.id, user : { $exists: false }}, 
            {user: req.user, sessionID: null}, {multi: true}, 
            function(err, obj){
                console.log("Previous searches linked to new user.");
            });
    }

    res.redirect('/profile');
}


var suggestedContent = function(question) {
    var suggestions = {};

    var lcQuestion = question.toLowerCase();
    if(lcQuestion.indexOf('child') >= 0 || lcQuestion.indexOf('custody') >= 0) {
        suggestions.questions = [ 'What is child custody?'
                                , 'What laws affect who gets custody?'
                                , 'What is joint custody?'
                                , 'What is the difference between joint and shared custody?'
                                , 'What is child access?'];
        suggestions.advertisement = 'child counselling services, daycares, and babysitters';
        suggestions.url = '/discounts/children'
    }
    else if(lcQuestion.indexOf('house') >= 0 || lcQuestion.indexOf('home') >= 0) {
        suggestions.questions = [ 'What is a matrimonial home?'
                                , 'How is the ownership of a matrimonial house decided?'
                                , 'Who will pay for the mortgage, and insurance until the house is sold?'
                                , 'How is the property split if it was mine before I got married?'
                                , 'Who will have to pay for maintenance of the house during the divorce?'];
        suggestions.advertisement = 'real estate agents, home inspectors, and mortage consultants';
        suggestions.url = '/discounts/realestate'
    } else {
        suggestions.questions = [ 'What is a divorce?'
                                , 'How long does a divorce take?'
                                , 'What is the difference between a mediated and collaborated divorce?'
                                , 'Can I prevent my spouse from having custody?'
                                , 'What is required to serve a document?'];
        suggestions.advertisement = 'lawyers, and other legal services';
        suggestions.url = '/discounts/lawyers'

    }

    return suggestions;
}