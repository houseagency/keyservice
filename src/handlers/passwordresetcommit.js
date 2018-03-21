const crypto = require('crypto');
const users = require('../users');
const sessions = require('../sessions');

function passwordResetCommit(req, res) {

	// Validate incoming data:

	const errs = [];
	if (typeof req.body.password !== 'string') {
		errs.push({ descr: 'password must be a string.' });
	}
	if (typeof req.body.code !== 'string') {
		errs.push({ descr: 'code must be a string.' });
	}
	if (Object.keys(req.body).length > 2) {
		errs.push({ descr: 'Unknown data in body payload.' });
	}
	if (errs.length) {
		return res.status(400).send({ errors: errs });
	}

	// Post reset code:

	users.passwordResetCodeToAccountId(req.body.code)
		.then((accountId) => {
			return users.updatePassword(accountId, req.body.password)
				.then(() => {
					return sessions.create(accountId);
				});
		})
		.then((session) => {
			res.status(200).send({ session });
		})
		.catch(err => {

			res.status(500).send({ errors: [ { descr: 'Internal Server Error' } ] });

		});
}

module.exports = passwordResetCommit;
