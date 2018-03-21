const errors = require('../errors');
const sessions = require('../sessions');
const users = require('../users');

function loginAccount(req, res) {

	// Validate incoming data:

	const errs = [];
	if (typeof req.body.userId !== 'string') {
		errs.push({ descr: 'userId must be a string.' });
	}
	if (typeof req.body.password !== 'string') {
		errs.push({ descr: 'password must be a string.' });
	}
	if (Object.keys(req.body).length > 2) {
		errs.push({ descr: 'Unknown data in body payload.' });
	}
	if (errs.length) {
		res.status(400).send({ errors: errs });
	}

	// Create the session and output result:

	users.loginIdToAccountId(req.body.userId)
		.then((accountId) => {
			return users.verifyPassword(accountId, req.body.password)
				.then(() => {
					return sessions.create(accountId);
				});
		})
		.then((session) => {
			res.status(200).send({ session });
		})
		.catch(err => {

			if (err instanceof errors.AccountDoesNotExistError
					|| err instanceof errors.WrongLoginCredentialsError) {
				res.status(400).send({ errors: [ { descr: 'Wrong login credentials.' } ] });

			} else {
				res.status(500).send({ errors: [ { descr: 'Internal Server Error' } ] });
			}

		});
};

module.exports = loginAccount;

