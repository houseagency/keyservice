const expect = require('chai').expect;
const mem = require('../../src/storagebackends/mem'); 
const td = require('testdouble');

const sessions = require('../../src/sessions');
const users = require('../../src/users');
const errors = require('../../src/errors');
const sessionistHeader = require('sessionistheader');

const putPrivateData = require('../../src/handlers/putprivatedata');

describe('handlers/putPrivateData()', () => {

	afterEach(() => mem.flush());

	it('will delete the account and the current session', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then((accountId) => {
				return sessions.create(accountId)
					.then((session) => {

						return new Promise((resolve, reject) => {

							const req = {
								method: 'PUT',
								url: '/privdata/hejhopp',
								headers: {
									date: new Date().toISOString()
								},
								body: {
									test: 123
								}
							};
							const res = {
								status: (value) => { res.status = value; return res; },
								send: (value) => {
									resolve({ status: res.status, content: value });
								}
							};
							req.rawBody = JSON.stringify(req.body);

							sessionistHeader(
								session.id,
								session.secret, 
								req.method,
								req.url,
								req.rawBody,
								req.headers['date']
							)
								.then((authHeader) => {
									req.headers.authorization = authHeader;

									putPrivateData(req, res);

								});
						});

					})
					.then((res) => {
						expect(res.status).to.equal(200);
					});
			});
	});

	it('will return a session error if the auth header has session which does not exist', () => {

		return new Promise((resolve, reject) => {

			const req = {
				method: 'PUT',
				url: '/privdata/hoppsan',
				headers: {
					date: new Date().toISOString()
				},
				body: {
					blarf: 'yay'
				}
			};
			const res = {
				status: (value) => { res.status = value; return res; },
				send: (value) => {
					resolve({ status: res.status, content: value });
				}
			};
			req.rawBody = JSON.stringify(req.body);

			sessionistHeader(
				'abc',
				'123',
				req.method,
				req.url,
				req.rawBody,
				req.headers['date']
			)
				.then((authHeader) => {
					req.headers.authorization = authHeader;

					putPrivateData(req, res);

				});
		})
			.then((res) => {
				expect(res.status).to.equal(400);
				expect(res.content).to.be.an('object');
				expect(res.content).to.deep.equal({
					errors: [ { descr: 'Invalid session.' } ]
				});
			});

	});

});
