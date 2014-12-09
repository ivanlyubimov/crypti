var async = require('async');
var Router = require('../helpers/router.js');
var util = require('util');
var genesisBlock = require("../helpers/genesisblock.js")

//private
var modules, library, self, loaded;
var total = 0;

//constructor
function Loader(cb, scope) {
	library = scope;
	loaded = false;
	self = this;

	var router = new Router();

	router.get('/status', function (req, res) {
		if (modules.blocks.getLastBlock()) {
			return res.json({
				success: true,
				loaded: self.loaded(),
				now: modules.blocks.getLastBlock().height,
				blocksCount: total
			});
		} else {
			return res.json({success: false});
		}
	})

	library.app.use('/api/loader', router);

	cb(null, this);
}

Loader.prototype.loaded = function () {
	return loaded;
}

//public
Loader.prototype.run = function (scope) {
	modules = scope;

	var offset = 0, limit = 1000;
	modules.blocks.count(function (err, count) {
		total = count;
		library.logger.info('blocks ' + count)
		async.until(
			function () {
				return count < offset
			}, function (cb) {
				library.logger.info('current ' + offset);
				process.nextTick(function () {
					modules.blocks.loadBlocksPart(limit, offset, function (err, res) {
						offset = offset + limit;
						cb(err, res)
					});
				})
			}, function (err, res) {
				if (err) {
					library.logger.error(err);
				}

				loaded = true;
				library.logger.info('blockchain ready');

				library.bus.message('blockchain ready');
			}
		)
	})
}

Loader.prototype.updatePeerList = function (cb) {
	modules.transport.getFromRandomPeer('/list', function (err, list) {
		if (!err) {
			modules.peer.add(list, cb);
		} else {
			cb(err);
		}
	});
}

Loader.prototype.loadBlocks = function (cb) {
	modules.transport.getFromRandomPeer('/peer/weight', function (err, resp, peer) {
		if (err) {
			return cb(err);
		} else {
			if (modules.blocks.getWeight().lt(resp.weight)) {
				if (modules.blocks.getLastBlock().id != genesisBlock.blockId) {
					modules.blocks.getMilestoneBlock(peer, function (err, milestoneBlock) {
						if (err) {
							return cb(err);
						} else {
							modules.blocks.getCommonBlock(milestoneBlock, peer, function (err, commonBlock) {
								if (err) {
									return cb(err);
								} else {
									// load blocks from common
								}
							})
						}
					})
				} else {
					var commonBlock = genesisBlock.blockId;
					// load blocks from common
				}
			} else {
				return cb();
			}
		}
	});
}

Loader.prototype.onPeerReady = function () {
	process.nextTick(function nextUpdatePeerList() {
		self.updatePeerList(function () {
			setTimeout(nextUpdatePeerList, 60 * 1000);

			process.nextTick(function nextLoadBlock() {
				self.loadBlocks(function () {
					setTimeout(nextLoadBlock, 30 * 1000)
				})
			});

			process.nextTick(function nextGetUnconfirmedTransactions() {
				self.getUnconfirmedTransactions(function () {
					setTimeout(GetUnconfirmedTransactions, 15 * 1000)
				})
			});
		})
	});
}

//export
module.exports = Loader;