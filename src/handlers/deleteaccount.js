const errors = require('../errors');
const sessions = require('../sessions');
const users = require('../users');

function deleteAccount(req, res) {

	sessions.verifyAuthHeader(
		req.headers['authorization'],
		req.method,
		req.url,
		req.rawBody,
		req.headers['date']
	)
		.then((accountId) => {

			const sessionId = sessions.authHeaderSessionId(req.headers['authorization']);

			return Promise.all([
				sessions.del(sessionId),
				users.del(accountId)
			]);

		})
		.then(() => {
			res.status(200).send({});
		})

		.catch((err) => {


			if (err instanceof errors.AuthHeaderError) {
				res.status(400).send({ errors: [{ descr: 'Invalid session.' }] });

			} else {

				console.log(err);

				res.status(500).send({ errors: [{ descr: 'Internal Server Error' }] });
			}

		});	

};

module.exports = deleteAccount;
