var _, BattleQueue;

_ = require('underscore');
BattleQueue = require('../../model/BattleQueue');

function QueueRequest(req, res) {

	//Check user is logged
	var user = req.session.internalUser;

	if (_.isUndefined(user)) {
		res.status(401).end();
		return;
	}
	var agents = req.body.agents;

	if (agents.length < 2) {
		res.status(400).end();
		return;
	}

	var units = req.body.units;

	if (units < 1 || units > 10) {
		units = 5;
	}

	var newBattleQueue = new BattleQueue();
	newBattleQueue.agents = agents;
	newBattleQueue.status = "PENDING";
	newBattleQueue.requester = user._id;
	newBattleQueue.unis = units;

	newBattleQueue.save(function (err, response) {
		if (err) {
			res.status(500).json(err).end();
			return;
		}
		res.status(201).end();
	})


}
module.exports = QueueRequest;
