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
            "questionText" : req.body.question, // The question
            "formattedAnswer" : true
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

        if(typeof(body.question) == 'undefined' || error) {
            res.json(body);
            return;
        }

        // provide high/medium/low values for confidence
        var confidenceValue = body.question.evidencelist[0].value;
        body.confidence = confidenceScale(confidenceValue);


        // store question and answer (by userid if possible, or by sessionid)
        var ques = body.question.questionText;
        var newResult = new Result();
        // Capitalize first letter in sentence
        newResult.question  = ques.charAt(0).toUpperCase() + ques.slice(1);
        
        // for evidencelist text
        newResult.answer    = JSON.stringify(body.question.evidencelist);

        // for formatted text
        // newResult.answer    = JSON.stringify(body.question.answers);
        // newResult.evidence  = JSON.stringify(body.question.evidencelist);

        newResult.created_at = Date.now();
        newResult.confidenceLevel = body.confidence.level;
        newResult.confidenceColor = body.confidence.colorIndicator;
        newResult.confidenceValue = body.confidence.val;

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

        console.log("confidence: " + confidenceValue);
        // Return the QAAPI response in the entity body
        res.json(body);


    });
}

exports.getAccountHistory = function(req, res) {
    if (req.isAuthenticated()) {
        Result.find({user: req.user}, null, {sort: {created_at: 'desc'}}, 
            function(err, searches){
                // console.log(searches);
                res.render('index', {
                    savedSearches : searches
                });

        });
    }
    else { // user is not logged on, find results based on sessionID
        Result.find({sessionID: req.session.id, user : { $exists: false }}, null
            , {sort: {created_at: 'desc'}}, function(err, searches){
                // console.log(searches);
                res.render('index', {
                    savedSearches : searches
                });

        });
    }
}


// used to find history from database to display in /history page
exports.fetchHistoryPage = function(req, res) {

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

    res.redirect('/');
}

// given a confidence value, gives a high/medium/low and green/yellow/red object
var confidenceScale = function(c) {
    confidenceInfo = {};
    confidenceInfo.val = (c * 100).toFixed(2) + "%";

    if (c >= 0.6) {
        confidenceInfo.level = "HIGH";
        confidenceInfo.colorIndicator = "green";
    } else if (c >= 0.3) {
        confidenceInfo.level = "MEDIUM";
        confidenceInfo.colorIndicator = "yellow";
    } else {
        confidenceInfo.level = "LOW";
        confidenceInfo.colorIndicator = "red"; 
    }

    return confidenceInfo;
};

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
        suggestions.url = '/discounts#childCare'
    }
    else if(lcQuestion.indexOf('house') >= 0 || lcQuestion.indexOf('home') >= 0) {
        suggestions.questions = [ 'What is a matrimonial home?'
                                , 'How is the ownership of a matrimonial house decided?'
                                , 'Who will pay for the mortgage, and insurance until the house is sold?'
                                , 'How is the property split if it was mine before I got married?'
                                , 'Who will have to pay for maintenance of the house during the divorce?'];
        suggestions.advertisement = 'real estate agents, home inspectors, and mortage consultants';
        suggestions.url = '/discounts#estate'
    } else {
        suggestions.advertisement = 'lawyers, and other legal services';
        suggestions.url = '/discounts#lawyer'

    }

    return suggestions;
}