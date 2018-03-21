const crypto = require('crypto');
const users = require('../users');

function passwordResetInit(req, res) {

	// Validate incoming data:

	const errs = [];
	if (typeof req.body.userId !== 'string') {
		errs.push({ descr: 'userId must be a string.' });
	}
	if (typeof req.body.trackId !== 'string') {
		errs.push({ descr: 'trackId must be a string.' });
	}
	if (Object.keys(req.body).length > 2) {
		errs.push({ descr: 'Unknown data in body payload.' });
	}
	if (errs.length) {
		res.status(400).send({ errors: errs });
	}

	// Post reset code:

	users.loginIdToAccountId(req.body.userId)
		.then((accountId) => {
			return users.postPasswordResetCode(req.body.trackId, accountId);
		})
		.then(() => {
			res.status(200).send({});
		})
		.catch(err => {

			if (err instanceof errors.AccountDoesNotExistError
					|| err instanceof errors.WrongLoginCredentialsError) {
				res.status(400).send({ errors: [ { descr: 'Wrong login credentials.' } ] });

			} else {
				res.status(500).send({ errors: [ { descr: 'Internal Server Error' } ] });
			}

		});
}

module.exports = passwordResetInit;
