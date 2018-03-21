const userHashSalt = 'q3FE4ch5bE4PKwuUFj2BMREyHPNiF48dhNxuz4ygXtc';
const passwordHashSalt = 'pyxtVmWbyqTuUMcFyqec21l0CqvzhFWFcOYFmXEa1g';
const passwordResetTemplateCodeCryptoPassphrase = 'n3AP35qT9yXlSf4HV5uVFu5XBcY';
const passwordResetCodeCryptoPassphrase = 'N8aUdU0L5Bjy0M9qDUEjuagN9Zx8uWVqxo';

const crypto = require('crypto');
const { toStr } = require('./buffertool');
const storage = require('./storage');

const errors = require('./errors');

function create(loginIds, password) {
	// Prepare user object to be stored:

	const id = toStr(crypto.randomBytes(64));
	const userObj = {
		loginIds: [],
		pw: hashUserPassword(password)
	};
	loginIds.forEach(userId => {
		userObj.loginIds.push(hashLoginId(userId));
	});

	// Check for duplicates:

	return Promise.all(userObj.loginIds.map(id => storage.exists('/loginids/' + id)))
		.then((existsArr) => {
			return existsArr.reduce((acc, val, idx) => {
				if (val) {
					acc.push({
						descr: 'User ID exists.',
						userId: loginIds[idx]
					});
				}
				return acc;
			}, []);
		})
		.then((existsErrors) => {
			if (existsErrors.length !== 0) {
				throw { existsErrors };
			}
		})
		.then(() => {

			// store the userObj:
			
			return storage.put('/users/' + id, JSON.stringify(userObj))
		})
		.then(() => {

			// Store the user ids with reference to the userObj:

			return Promise.all(
				userObj.loginIds.reduce((curr, val) => {
					curr.push(
						storage.put('/loginids/' + val, JSON.stringify({ id }))
					);
					return curr;
				}, [])
			);
		})
		.then(() => {
			return id; // Create promise resolves with new id.
		});

}

function del(accountId) {
	return storage.get('/users/' + accountId)
		.then((data) => JSON.parse(data.toString()))
		.then((data) => data.loginIds)
		.then((loginIds) => {
			const delPromises = [
				storage.del('/users/' + accountId)
			];
			loginIds.forEach((loginId) => {
				delPromises.push(
					storage.del('/loginids/' + loginId)
				);
			});
			return Promise.all(delPromises);
		});
}

function createPasswordResetCode(accountId) {
	const code = toStr(crypto.randomBytes(24));
	return storage.put(
		'/passwordreset/' + code,
		JSON.stringify({
			id: accountId
		}),
		60 * 60 * 2 // Two hours TTL (until mail should be rendered)
	)
	.then(() => {
		return code;
	});
}

function passwordResetCodeToAccountId(code) {
	return storage.get('/passwordreset/' + code)
		.then((data) => JSON.parse(data.toString()))
		.then((data) => {
			return storage.del('/passwordreset/' + code)
				.then(() => {
					return data.id
				});
		})
		.catch((err) => {
			if (err instanceof errors.StoredDataDoesNotExistError) {
				throw new errors.ResetCodeInvalidError();
			} else {
				throw err;
			}
		});
}

function postPasswordResetCode(attemptId, accountId) {

	// This function should post attemptId and code to some pre-defined URL,
	// which is the mail template engine that creates a password reset email.

	return createPasswordResetCode(accountId)
		.then((code) => {

			// Here we do the post request with code and attemptId.
			
		});

}

function loginIdToAccountId(loginId) {
	const hashedLoginId = hashLoginId(loginId);
	return storage.get('/loginids/' + hashedLoginId)
		.then((data) => JSON.parse(data.toString()))
		.then((data) => data.id)
		.catch((err) => {
			if (err instanceof errors.StoredDataDoesNotExistError) {
				throw new errors.AccountDoesNotExistError();
			} else {
				throw err;
			}
		});
}

function updateLoginIds(accountId, loginIds) {

	loginIds = loginIds.map((loginId) => hashLoginId(loginId));

	return storage.get('/users/' + accountId)
		.then((data) => JSON.parse(data.toString()))
		.then((accountObj) => {
			const toBeAdded = loginIds
				.filter(
					(loginId) => accountObj.loginIds.indexOf(loginId) === -1
				);
			const toBeRemoved = accountObj.loginIds
				.filter(
					(loginId) => loginIds.indexOf(loginId) === -1
				);
			return Promise.all(toBeAdded.map((id) => {
					return storage.exists('/loginids/' + id)
						.then((exists) => {
							if (!exists) {
								return false;
							}

							// loginId already exists. However, if it already
							// contains a reference to the right accountId,
							// it should not cause an "already exists" error:

							return storage.get('/loginids/' + id)
								.then((data) => JSON.parse(data.toString()))
								.then((data) => {
									if (data.id === accountId) {
										return false;
									}
									return true;
								});
						})
				}))
				.then((existsArr) => {
					return existsArr.reduce((acc, val, idx) => {
						if (val) {
							acc.push({
								descr: 'User ID exists.',
								userId: loginIds[idx]
							});
						}
						return acc;
					}, []);
				})
				.then((existsErrors) => {
					if (existsErrors.length !== 0) {
						throw { existsErrors };
					}
				})
				.then(() => {
					// Now, lets create all new references from loginIds:
					return Promise.all(toBeAdded.map(
						(loginId) => storage.put(
							'/loginids/' + loginId,
							JSON.stringify({ id: accountId })
						)
					));
				})
				.then(() => {
					// Store the account blob:
					accountObj.loginIds = loginIds;
					return storage.put(
						'/users/' + accountId,
						JSON.stringify(accountObj)
					);
				})
				.then(() => {
					// Delete references to old loginIds:
					return Promise.all(toBeRemoved.map(
						(loginId) => storage.del('/loginids/' + loginId)
					));
				})
		});
}

function updatePassword(accountId, newPassword) {
	return storage.get('/users/' + accountId)
		.then((data) => JSON.parse(data.toString()))
		.then((data) => {
			data.pw = hashUserPassword(newPassword)
			return storage.put('/users/' + accountId, JSON.stringify(data))
		})
}

function verifyPassword(accountId, password) {
	return storage.get('/users/' + accountId)
		.then((data) => JSON.parse(data.toString()))
		.then((data) => data.pw)
		.then((storedPassword) => {
			if (storedPassword === hashUserPassword(password)) {
				return true;
			}
			throw new errors.WrongLoginCredentialsError();
		});
}

function hashLoginId(userId) {
	return toStr(
		crypto.createHmac('sha512', userHashSalt)
			.update(new Buffer(userId, 'utf-8'))
			.digest()
	);
}

function hashUserPassword(password) {
	return toStr(
		crypto.createHmac('sha512', passwordHashSalt)
			.update(new Buffer(password, 'utf-8'))
			.digest()
	);
}

module.exports = {
	create,
	createPasswordResetCode,
	del,
	loginIdToAccountId,
	passwordResetCodeToAccountId,
	postPasswordResetCode,
	updateLoginIds,
	updatePassword,
	verifyPassword,
	_internal: {
		hashLoginId,
		hashUserPassword
	}
};
