var ModelName, _, Mongoose, Battle;

ModelName = 'Map';
_ = require('underscore');
Mongoose = require('mongoose');

Map = new Mongoose.Schema({
	id: {type: Number, index: true},
	default: {type: Boolean, required: true, default: false},
	name: {type: String, required: true},
	data: {type: Object, required: true}
});

module.exports = Mongoose.model(ModelName, Map);


