var ed = require('ed25519'),
	bignum = require('bignum'),
	ByteBuffer = require("bytebuffer"),
	crypto = require('crypto'),
	constants = require("../helpers/constants.js"),
	slots = require('../helpers/slots.js'),
	signatureHelper = require("../helpers/signature.js"),
	RequestSanitizer = require('../helpers/request-sanitizer.js'),
	Router = require('../helpers/router.js'),
	async = require('async');

// private fields
var modules, library, self;

function Signature() {
	this.create = function (data, trs) {
		return trs;
	}

	this.calculateFee = function (trs) {
		return 100 * constants.fixedPoint;
	}

	this.verify = function (trs, sender, cb) {
		if (!trs.asset.signature) {
			return cb("Empty transaction asset for signature transaction")
		}

		try {
			if (new Buffer(trs.asset.signature.publicKey, 'hex').length != 32) {
				cb("Invalid length for signature public key");
			}
		} catch (e) {
			cb("Invalid hex in signature public key");
		}

		cb(null, trs);
	}

	this.getBytes = function (trs) {
		return null;
	}

	this.objectNormalize = function (trs) {
		trs.asset.signature = RequestSanitizer.validate(trs.asset.signature, {
			object: true,
			properties: {
				id: "string",
				transactionId: "string",
				publicKey: "hex"
			}
		}).value;

		return trs;
	}

	this.dbRead = function (raw) {
		if (!raw.s_id) {
			return null
		} else {
			var signature = {
				id: raw.s_id,
				transactionId: raw.t_id,
				publicKey: raw.s_publicKey
			}

			return {signature: signature};
		}
	}
}

//constructor
function Signatures(cb, scope) {
	library = scope;
	self = this;

	attachApi();

	library.logic.transaction.attachAssetType(1, new Signature());

	setImmediate(cb, null, self);
}

//private methods
function attachApi() {
	var router = new Router();

	router.use(function (req, res, next) {
		if (modules) return next();
		res.status(500).send({success: false, error: 'loading'});
	});

	router.put('/', function (req, res) {
		req.sanitize("body", {
			secret: "string!",
			secondSecret: "string?",
			publicKey: "hex?"
		}, function (err, report, body) {
			if (err) return next(err);
			if (!report.isValid) return res.json({success: false, error: report.issues});

			var secret = body.secret,
				secondSecret = body.secondSecret,
				publicKey = body.publicKey;

			var hash = crypto.createHash('sha256').update(secret, 'utf8').digest();
			var keypair = ed.MakeKeypair(hash);

			if (publicKey) {
				if (keypair.publicKey.toString('hex') != publicKey) {
					return res.json({success: false, error: "Please, provide valid secret key of your account"});
				}
			}

			var account = modules.accounts.getAccountByPublicKey(keypair.publicKey.toString('hex'));

			if (!account) {
				return res.json({success: false, error: "Account doesn't has balance"});
			}

			if (!account.publicKey) {
				return res.json({success: false, error: "Open account to make transaction"});
			}

			if (account.secondSignature || account.unconfirmedSignature) {
				return res.json({success: false, error: "Second signature already enabled"});
			}

			var transaction = library.logic.transaction.create({
				type: 1,
				asset: {
					signature: newSignature(secondSecret)
				},
				sender: account,
				keypair: keypair
			});

			library.sequence.add(function (cb) {
				modules.transactions.processUnconfirmedTransaction(transaction, true, cb);
			}, function (err) {
				if (err) {
					return res.json({success: false, error: err});
				}
				res.json({success: true, transaction: transaction});
			});
		});
	});

	router.use(function (req, res, next) {
		res.status(500).send({success: false, error: 'api not found'});
	});

	library.app.use('/api/signatures', router);
	library.app.use(function (err, req, res, next) {
		err && library.logger.error('/api/signatures', err)
		if (!err) return next();
		res.status(500).send({success: false, error: err.toString()});
	});
}

function newSignature(secondSecret) {
	var hash = crypto.createHash('sha256').update(secondSecret, 'utf8').digest();
	var keypair = ed.MakeKeypair(hash);

	var signature = {
		publicKey: keypair.publicKey.toString('hex')
	};

	signature.id = signatureHelper.getId(signature);
	return signature;
}

function sign(signature, secondSecret) {
	var hash = signatureHelper.getHash(signature);
	var passHash = crypto.createHash('sha256').update(secondSecret, 'utf8').digest();
	var keypair = ed.MakeKeypair(passHash);
	return ed.Sign(hash, keypair).toString('hex');
}

function secondSignature(signature, secret) {
	var hash = signatureHelper.getHash(signature);
	var passHash = crypto.createHash('sha256').update(secret, 'utf8').digest();
	var keypair = ed.MakeKeypair(passHash);
	return ed.Sign(hash, keypair).toString('hex');
}

//public methods

//events
Signatures.prototype.onBind = function (scope) {
	modules = scope;
}

module.exports = Signatures;