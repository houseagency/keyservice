const errors = require('../errors');
const sessions = require('../sessions');
const users = require('../users');

function updateLoginIds(req, res) {

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

			if (!Array.isArray(req.body.userIds) || req.body.userIds.length < 1) {
				errs.push({ descr: 'userIds must be an array with values.' });
			} else {
				req.body.userIds.forEach(userId => {
					if (typeof userId !== 'string') {
						errs.push({
							descr: 'All userIds must be strings.',
							userId
						});
					}
				});
			}
			if (Object.keys(req.body).length > 2) {
				errs.push({ descr: 'Unknown data in body payload.' });
			}
			if (errs.length) {
				res.status(400).send({ errors: errs });
				return;
			}
			return users.updateLoginIds(accountId, req.body.userIds)
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

module.exports = updateLoginIds;
