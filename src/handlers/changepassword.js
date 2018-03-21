const errors = require('../errors');
const sessions = require('../sessions');
const users = require('../users');

function changePassword(req, res) {

	sessions.verifyAuthHeader(
		req.headers['authorization'],
		req.method,
		req.url,
		req.rawBody,
		req.headers['date']
	)
		.then((accountId) => {


			// Validate incoming data:

			const errs = [];
			if (typeof req.body.password !== 'string') {
				errs.push({ descr: 'password must be a string.' });
			}
			if (typeof req.body.previousPassword !== 'string') {
				errs.push({ descr: 'previousPassword must be a string.' });
			}
			if (Object.keys(req.body).length > 2) {
				errs.push({ descr: 'Unknown data in body payload.' });
			}
			if (errs.length) {
				res.status(400).send({ errors: errs });
				return;
			}

			return users.verifyPassword(accountId, req.body.previousPassword)
				.then(() => users.updatePassword(accountId, req.body.password))
				.then(() => {

					res.status(200).send({});

				});

		})
		.catch((err) => {

			if (err instanceof errors.AuthHeaderError) {
				res.status(400).send({ errors: [{ descr: 'Invalid session.' }] });

			} else if (err instanceof errors.WrongLoginCredentialsError) {
				res.status(400).send({ errors: [{ descr: 'Wrong password.' }] });

			} else {
				res.status(500).send({ errors: [{ descr: 'Internal Server Error' }] });
			}

		});	

};

module.exports = changePassword;
