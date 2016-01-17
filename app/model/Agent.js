var ModelName, _, Mongoose, Agent;

ModelName = 'Agent';
_ = require('underscore');
Mongoose = require('mongoose');

Agent = new Mongoose.Schema({
	name: {type: String, required: true},
	user: {type: Mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
	moment: {type: Date, required: true},
	color: {type: String, required:false}
});

module.exports = Mongoose.model(ModelName, Agent);

