const expect = require('chai').expect;
const mem = require('../../src/storagebackends/mem'); 
const td = require('testdouble');

const updateLoginIds = require('../../src/handlers/updateloginids');
const sessions = require('../../src/sessions');
const users = require('../../src/users');
const sessionistHeader = require('sessionistheader');
const errors = require('../../src/errors');

describe('handlers/updateLoginIds()', () => {

	afterEach(() => mem.flush());

	it('will update the login ids', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then((accountId) => {
				return sessions.create(accountId)
					.then((session) => {

						return new Promise((resolve, reject) => {

							const req = {
								method: 'PUT',
								url: '/account',
								headers: {
									date: new Date().toISOString()
								},
								body: {
									userIds: [
										'derfla',
										'affe'
									]
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

									updateLoginIds(req, res);

								});
						});

					})
					.then((res) => {

						expect(res.status).to.equal(200);
						expect(res.content).to.be.an('object');
						expect(res.content).to.deep.equal({});

						return users.loginIdToAccountId('alfred');
					})
					.catch((err) => {
						return err;
					})
					.then((err) => {
						expect(err).to.be.instanceOf(errors.AccountDoesNotExistError);

						return users.loginIdToAccountId('derfla');
					})
					.then((id) => {
						expect(id).to.equal(accountId);

						return users.loginIdToAccountId('affe');
					})
					.then((id) => {
						expect(id).to.equal(accountId);
					});
			});
	});

	it('will return a session error if the auth header has session which does not exist', () => {

		return new Promise((resolve, reject) => {

			const req = {
				method: 'PUT',
				url: '/account',
				headers: {
					date: new Date().toISOString()
				},
				body: {
					userIds: [
						'derfla',
						'affe'
					]
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

					updateLoginIds(req, res);

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
								method: 'PUT',
								url: '/account',
								headers: {
									date: new Date().toISOString()
								},
								body: {
									userIds: [
										123
									]
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

									updateLoginIds(req, res);

								});
						});

					})
					.then((res) => {
						expect(res.status).to.equal(400);
						expect(res.content).to.deep.equal({
							errors: [
								{
									descr: 'All userIds must be strings.',
									userId: 123
								}
							]
						});
					});
			});
	});

});
