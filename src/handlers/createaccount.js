const sessions = require('../sessions');
const users = require('../users');

function createAccount(req, res) {

	// Validate incoming data:

	const errors = [];
	if (typeof req.body.password !== 'string') {
		errors.push({ descr: 'Password must be a string.' });
	}
	if (!Array.isArray(req.body.userIds) || req.body.userIds.length < 1) {
		errors.push({ descr: 'userIds must be an array with values.' });
	} else {
		req.body.userIds.forEach(userId => {
			if (typeof userId !== 'string') {
				errors.push({
					descr: 'All userIds must be strings.',
					userId
				});
			}
		});
	}
	if (Object.keys(req.body).length > 2) {
		errors.push({ descr: 'Unknown data in body payload.' });
	}
	if (errors.length) {
		res.status(400).send({ errors });
	}

	// Create the user and output result:

	users.create(req.body.userIds, req.body.password)
		.then((id) => {

			sessions.create(id)
				.then((session) => {
					res.status(200).send({
						'session': {
							id: session.id,
							secret: session.secret,
							age: session.age
						}
					});
				});
		})
		.catch(err => {

			if (err.existsErrors) {

				// At least one of the user ids exists already:

				res.status(400).send({ errors: err.existsErrors });

			} else {
				console.log(err);
				res.status(500).send({ errors: [{ descr: 'Internal Server Error' }] });
			}

		});
};

module.exports = createAccount;

