const crypto = require('crypto');
const errors = require('./errors');
const storage = require('./storage');
const { toStr } = require('./buffertool');
const sessionistHeader = require('sessionistheader');

const ttl = 60 * 60 * 24 * 7;

function create(accountId) {
	const id = toStr(crypto.randomBytes(16));
	const secret = toStr(crypto.randomBytes(64));
	return storage.put(
		'/sessions/' + id,
		JSON.stringify({
			accountId,
			secret,
			time: Math.floor((new Date()).getTime() / 1000)
		}),
		ttl
	).then(() => {
		return {
			id,
			secret,
			age: 0
		};
	});
}

function del(sessionId) {
	return storage.del('/sessions/' + sessionId);
}

function sessionIdToAccountId(id) {
	return storage.get('/sessions/' + id)
		.then((data) => JSON.parse(data.toString()))
		.then((data) => {
			return data.accountId
		});
}

function authHeaderSessionId(authHeader) {
	return authHeader
		.replace(/^ss1 keyid=/, '')
		.replace(/,.*$/, '');
}

function verifyAuthHeader(authHeader, method, path, body, dateHeader) {
	let accountId;

	if (typeof body === 'undefined') {
		body = '';
	} else if (Buffer.isBuffer(body)) {

		// TODO:
		// When sessionistheader supports bufferarrays, we should convert to
		// that instead...

		body = body.toString();
	}

	return sessionistHeader.verify(
		authHeader,
		method,
		path,
		body,
		dateHeader,
		(keyid, callback) => {
			storage.get('/sessions/' + keyid)
				.then((data) => JSON.parse(data.toString()))
				.then((data) => {
					accountId = data.accountId;
					callback(null, data.secret);
				})
				.catch((err) => {
					callback(new errors.AuthHeaderError());
				});
		}
	)
	.then(() => {
		return accountId;
	})
	.catch((err) => {
		throw new errors.AuthHeaderError();
	});
}

module.exports = {
	authHeaderSessionId,
	create,
	del,
	sessionIdToAccountId,
	verifyAuthHeader
};
