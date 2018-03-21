const expect = require('chai').expect;
const mem = require('../../src/storagebackends/mem'); 
const td = require('testdouble');

const storage = require('../../src/storage');
const sessions = require('../../src/sessions');
const users = require('../../src/users');
const errors = require('../../src/errors');
const sessionistHeader = require('sessionistheader');

const getPrivateData = require('../../src/handlers/getprivatedata');

describe('handlers/getPrivateData()', () => {

	afterEach(() => mem.flush());

	it('will return stored data', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then((accountId) => {

				return storage.put(
					'/privdata/' + accountId + '/test',
					'{ "abc": "123" }'
				)
					.then(() => sessions.create(accountId))
					.then((session) => {

						return new Promise((resolve, reject) => {

							const req = {
								method: 'GET',
								url: '/privdata/test',
								headers: {
									date: new Date().toISOString()
								},
								rawBody: ''
							};
							const res = {
								status: (value) => { res.status = value; return res; },
								send: (value) => {
									resolve({ status: res.status, content: value });
								}
							};

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

									getPrivateData(req, res);

								});
						});

					})
					.then((res) => {
						expect(res.status).to.equal(200);
						expect(res.content).to.deep.equal(
							Buffer.from('{ "abc": "123" }')
						);
					});
			});
	});

	it('will return 404 if data does not exist', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then((accountId) => {

				return sessions.create(accountId)
					.then((session) => {

						return new Promise((resolve, reject) => {

							const req = {
								method: 'GET',
								url: '/privdata/test',
								headers: {
									date: new Date().toISOString()
								},
								rawBody: ''
							};
							const res = {
								status: (value) => { res.status = value; return res; },
								send: (value) => {
									resolve({ status: res.status, content: value });
								}
							};

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

									getPrivateData(req, res);

								});
						});

					})
					.then((res) => {
						expect(res.status).to.equal(404);
						expect(res.content).to.deep.equal({
							errors: [ { descr: 'Not Found.' } ]
						});
					});
			});
	});

	it('will return a session error if the auth header has session which does not exist', () => {

		return new Promise((resolve, reject) => {

			const req = {
				method: 'GET',
				url: '/privdata/hoppsan',
				headers: {
					date: new Date().toISOString()
				},
				rawBody: ''
			};
			const res = {
				status: (value) => { res.status = value; return res; },
				send: (value) => {
					resolve({ status: res.status, content: value });
				}
			};

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

					getPrivateData(req, res);

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
