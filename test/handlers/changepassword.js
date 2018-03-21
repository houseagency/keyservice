const expect = require('chai').expect;
const mem = require('../../src/storagebackends/mem'); 
const td = require('testdouble');

const changePassword = require('../../src/handlers/changepassword');
const sessions = require('../../src/sessions');
const users = require('../../src/users');
const sessionistHeader = require('sessionistheader');
const errors = require('../../src/errors');

describe('handlers/changePassword()', () => {

	afterEach(() => mem.flush());

	it('will delete the account', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then((accountId) => {
				return sessions.create(accountId)
					.then((session) => {

						return new Promise((resolve, reject) => {

							const req = {
								method: 'POST',
								url: '/account/password',
								headers: {
									date: new Date().toISOString()
								},
								body: {
									previousPassword: 'topsecret',
									password: 'new password',
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

									changePassword(req, res);

								});
						});

					})
					.then((res) => {
						expect(res.status).to.equal(200);
						expect(res.content).to.be.an('object');
						expect(res.content).to.deep.equal({});

						return users.verifyPassword(accountId, 'new password');
					})
					.then((success) => {
						expect(success).to.equal(true);
					});
			});
	});

	it('will return a session error if the auth header has session which does not exist', () => {

		return new Promise((resolve, reject) => {

			const req = {
				method: 'POST',
				url: '/account/password',
				headers: {
					date: new Date().toISOString()
				},
				body: {
					previousPassword: 'topsecret',
					password: 'new password',
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

					changePassword(req, res);

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

	it('will return data validation errors if broken indata', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then((accountId) => {
				return sessions.create(accountId)
					.then((session) => {

						return new Promise((resolve, reject) => {

							const req = {
								method: 'POST',
								url: '/account/password',
								headers: {
									date: new Date().toISOString()
								},
								body: {
									previousPassword: 123,
									password: 123,
									blarf: 'hej'
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

									changePassword(req, res);

								});
						});

					})
					.then((res) => {
						expect(res.status).to.equal(400);
						expect(res.content).to.deep.equal({
							errors: [
								{ descr: 'password must be a string.' },
								{ descr: 'previousPassword must be a string.' },
								{ descr: 'Unknown data in body payload.' }
							]
						});
					});
			});
	});


});
