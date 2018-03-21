const expect = require('chai').expect;
const td = require('testdouble');

const handler = require('../src/handler');
const handlers = require('../src/handlers/index');

describe('handler', () => {

	it('should be a function', () => {
		expect(handler).to.be.a('function');
	});

	describe('routing', () => {

		beforeEach(() => {
			Object.keys(handlers).forEach(key =>
				td.replace(handlers, key)
			);
		});

		afterEach(() => {
			td.reset();
		});

		it('should handle POST requests to /account', () => {
			const req = { method: 'POST', url: '/account' };
			const res = {}
			handler(req, res);

			td.verify(handlers.createAccount(req, res), { times: 1 });
		});

		it('should handle PUT requests to /account', () => {
			const req = { method: 'PUT', url: '/account' };
			const res = {}
			handler(req, res);

			td.verify(handlers.updateLoginIds(req, res), { times: 1 });
		});

		it('should handle DELETE requests to /account', () => {
			const req = { method: 'DELETE', url: '/account' };
			const res = {}
			handler(req, res);

			td.verify(handlers.deleteAccount(req, res), { times: 1 });
		});

		it('should handle POST requests to /account/login', () => {
			const req = { method: 'POST', url: '/account/login' };
			const res = {}
			handler(req, res);

			td.verify(handlers.loginAccount(req, res), { times: 1 });
		});

		it('should handle POST requests to /account/password', () => {
			const req = { method: 'POST', url: '/account/password' };
			const res = {}
			handler(req, res);

			td.verify(handlers.changePassword(req, res), { times: 1 });
		});

		it('should handle POST requests to /account/pwreset/commit', () => {
			const req = { method: 'POST', url: '/account/pwreset/commit' };
			const res = {}
			handler(req, res);

			td.verify(handlers.passwordResetCommit(req, res), { times: 1 });
		});

		it('should handle POST requests to /account/pwreset/commit', () => {
			const req = { method: 'POST', url: '/account/pwreset/commit' };
			const res = {}
			handler(req, res);

			td.verify(handlers.passwordResetCommit(req, res), { times: 1 });
		});

		it('should handle POST requests to /account/pwreset/init', () => {
			const req = { method: 'POST', url: '/account/pwreset/init' };
			const res = {}
			handler(req, res);

			td.verify(handlers.passwordResetInit(req, res), { times: 1 });
		});

		it('should handle GET requests to /privdata/somedata', () => {
			const req = { method: 'GET', url: '/privdata/somedata' };
			const res = {}
			handler(req, res);

			td.verify(handlers.getPrivateData(req, res), { times: 1 });
		});

		it('should handle PUT requests to /privdata/somedata', () => {
			const req = { method: 'PUT', url: '/privdata/somedata' };
			const res = {}
			handler(req, res);

			td.verify(handlers.putPrivateData(req, res), { times: 1 });
		});

	});

});
