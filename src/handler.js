const handlers = require('./handlers/index');

function handler(req, res) {

	let m;

	if (req.url.match(/^\/account\/login(\/.*){0,1}$/)) {
	
		if (req.method === 'POST') {
			return handlers.loginAccount(req, res);
		}

	} else if (req.url.match(/^\/account\/password(\/.*){0,1}$/)) {
	
		if (req.method === 'POST') {
			return handlers.changePassword(req, res);
		}

	} else if (req.url.match(/^\/account\/pwreset\/commit(\/.*){0,1}$/)) {
	
		if (req.method === 'POST') {
			return handlers.passwordResetCommit(req, res);
		}

	} else if (req.url.match(/^\/account\/pwreset\/init(\/.*){0,1}$/)) {
	
		if (req.method === 'POST') {
			return handlers.passwordResetInit(req, res);
		}

	} else if (req.url.match(/^\/account(\/.*){0,1}$/)) {

		if (req.method === 'POST') {
			return handlers.createAccount(req, res);
		} else if (req.method === 'PUT') {
			return handlers.updateLoginIds(req, res);
		} else if (req.method === 'DELETE') {
			return handlers.deleteAccount(req, res);
		}
	} else if (m = req.url.match(/^\/privdata(\/.+)$/)) {

		if (req.method === 'PUT') {
			return handlers.putPrivateData(req, res);
		} else if (req.method === 'GET') {
			return handlers.getPrivateData(req, res);
		}

	}

	return res.status(405).send({ errors: [ { descr: 'Method Not Allowed' } ] });
};

module.exports = handler;
