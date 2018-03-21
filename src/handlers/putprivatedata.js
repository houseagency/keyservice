const errors = require('../errors');
const sessions = require('../sessions');
const storage = require('../storage');
const users = require('../users');

function putPrivateData(req, res) {

	sessions.verifyAuthHeader(
		req.headers['authorization'],
		req.method,
		req.url,
		req.rawBody,
		req.headers['date']
	)
		.then((accountId) => {

			// Validate incoming data:

			return storage.put(
				req.url.replace(/^\/privdata/, '/privdata/' + accountId),
				req.rawBody
			)
				.then(() => {
					res.status(200).send({});
				});

		})
		.catch((err) => {

			if (err instanceof errors.AuthHeaderError) {
				res.status(400).send({ errors: [{ descr: 'Invalid session.' }] });

			} else {
				res.status(500).send({ errors: [{ descr: 'Internal Server Error' }] });
			}

		});	

};

module.exports = putPrivateData;
