"use strict";
/**
 * Created by Marcos on 1/02/14.
 */

var Q = require("q");
var VM = require("vm");
var _ = require("underscore");
var Game = require("../Game");
var AgentOutput = require("./interfaces/AgentOutput");
var Angle = require("../vendor/Angle");
var Vector2D = require("../vendor/Vector2D");
var Logger = require('../../logger.js');


var Agent = require('../../model/Agent');
var AgentVersion = require('../../model/AgentVersion');

/**
 * El controlador de agente usa fragmentos de javascript para calcular los futuros movimientos
 * del equipo.
 * @constructor
 */
function AgentController(_id, _game, _teamId) {
	var _self = this;

	this.id = _id;
	this.teamId = _teamId;
	this.game = _game;
	this.timeout = 500;
	this.timeoutStart = 2000;
	this.agent = undefined;
	this.prepared = false;
	this.agentVersionId = undefined;
	this.logString = "";

	var _contextObject = {};

	//Creating util property in ctx object
	Object.defineProperty(_contextObject, 'Utils', {
		writable: false,
		value: {
			Vector2D: Vector2D,
			log: function (log) {
				_self.logFromVm(log, 'info');
			}
		}
	});

	this.context = new VM.createContext(_contextObject);
}


AgentController.prototype.isPrepared = function () {
	return this.prepared;
};

AgentController.prototype.logFromVm = function (log, level) {
	level = level || 'info';
	Logger.log(level, 'Team: ' + this.teamId + ' | Agent controller log:');
	Logger.log(level, '---------------------');
	Logger.log(level, log);
	Logger.log(level, '---------------------');
	this.logString += '\r\n' + log;
};

/**
 * Tiempo de inicialización del agente, se deja un tiempo concreto de cómputo para que puedan
 * analizar la partida antes de comenzar
 */
AgentController.prototype.prepare = function () {
	var deferred = Q.defer();
	var _self = this;
	Logger.log('info', 'Preparing AgentController (teamId: ' + _self.teamId + ')');


	AgentVersion.findOne({agent: this.id}).sort('-moment')
		.exec(function (err, agentVersion) {
			if (err || agentVersion === null) {
				deferred.reject();
				Logger.log('error', 'AgentVersion can\'t be retrieved from database', err);
			}

			_self.agentVersionId = agentVersion._id;

			_self.context.game = _self.game.getGameState();
			_self.context.me = _.pick(_self.game.teams[_self.teamId], "id", "name", "color", "units");

			try {
				VM.runInContext(agentVersion.code, _self.context);
				VM.runInContext("init()", _self.context, {timeout: _self.timeoutStart});
				Logger.log('debug', '(AgentVersion: ' + _self.agentVersionId + ') User code [init] executed successfully in VM');
				_self.prepared = true;
				deferred.resolve();
			} catch (error) {
				_self.log(error.stack);
				Logger.log('debug', '(AgentVersion: ' + _self.agentVersionId + ') User code [init] failed to execute VM');
				_self.logFromVm(error.stack,'error');
				deferred.reject();
			}
		});

	return deferred.promise;
};

/**
 * Ejecuta en el sandbox el código del agente y devuelve la salida para la ronda
 * @returns {*}
 */
AgentController.prototype.tick = function () {
	var _self = this;

	if (!this.isPrepared()) {
		throw "The controller isn't prepared";
	}

	try {
		this.context.output = new AgentOutput();
		this.context.game = this.game.getGameState();
		VM.runInContext("tick()", this.context, {timeout: this.timeout});
		Logger.log('debug', '(AgentVersion: ' + _self.agentVersionId + ') User code [tick] executed successfully in VM');
	} catch (error) {
		Logger.log('debug', '(AgentVersion: ' + _self.agentVersionId + ') User code [tick] failed to execute VM');
		_self.logFromVm(error.stack,'error');
	}

	return this.context.output;

};

module.exports = AgentController;
