// load the things we need
var mongoose = require('mongoose');
var Schema 	 = mongoose.Schema;

// define the schema for our user model
var resultSchema = new Schema({

    question	: String,
    answer		: String,
    // for formatted text
    // evidence    : String,
    sessionID	: String,
    confidenceValue: String,
    confidenceLevel: String,
    confidenceColor: String,
    created_at  : { 
		type: Date, 
	},
    user 		: {
    	type: Schema.ObjectId,
    	ref: 'users'
    }


});

// create the model for users and expose it to our app
module.exports = mongoose.model('Result', resultSchema);