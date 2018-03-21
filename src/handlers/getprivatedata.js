const errors = require('../errors');
const sessions = require('../sessions');
const storage = require('../storage');
const users = require('../users');

function getPrivateData(req, res) {

	sessions.verifyAuthHeader(
		req.headers['authorization'],
		req.method,
		req.url,
		req.rawBody,
		req.headers['date']
	)
		.then((accountId) => {

			// Validate incoming data:

			return storage.get(
				req.url.replace(/^\/privdata/, '/privdata/' + accountId)
			)
				.then((data) => {
					res.status(200).send(data);
				})
				.catch((err) => {
					res.status(404).send({ errors: [{ descr: 'Not Found.' }] });
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

module.exports = getPrivateData;
