// load the things we need
var mongoose = require('mongoose');
var Schema 	 = mongoose.Schema;

// define the schema for our user model
var resultSchema = new Schema({

    question	: String,
    answer		: String,
    sessionID	: String,
    created_at  : { 
		type: Date, 
		default: Date.now() 
	},
    user 		: {
    	type: Schema.ObjectId,
    	ref: 'users'
    }


});

// create the model for users and expose it to our app
module.exports = mongoose.model('Result', resultSchema);