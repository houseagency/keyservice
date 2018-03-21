const expect = require('chai').expect;
const mem = require('../../src/storagebackends/mem'); 
const td = require('testdouble');

const loginAccount = require('../../src/handlers/loginaccount');
const sessions = require('../../src/sessions');
const users = require('../../src/users');

describe('handlers/loginAccount()', () => {

	afterEach(() => mem.flush());

	it('returns a session on login', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then(() => {
				return (new Promise((resolve, reject) => {
					const req = {
						body: {
							userId: 'alfred',
							password: 'topsecret'
						}
					};
					const res = {
						status: (value) => { res.status = value; return res; },
						send: (value) => {
							resolve({ status: res.status, content: value });
						}
					};

					loginAccount(req, res);
				}))
			})
			.then((res) => {
				expect(res.status).to.equal(200);
				expect(res.content).to.be.an('object');
				expect(res.content.session).to.be.an('object');
				expect(res.content.session.id).to.be.a('string');
				expect(res.content.session.secret).to.be.a('string');
				expect(res.content.session.age).to.be.a('number');

				return res.content.session.id;
			})
			.then((id) => sessions.sessionIdToAccountId(id))
			.then((accountId) => {
				return users.loginIdToAccountId('alfred')
					.then((id) => {
						expect(id).to.equal(accountId);
					});
			});
	});

	it('returns error on wrong password', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then(() => {
				return (new Promise((resolve, reject) => {
					const req = {
						body: {
							userId: 'alfred',
							password: 'password'
						}
					};
					const res = {
						status: (value) => { res.status = value; return res; },
						send: (value) => {
							resolve({ status: res.status, content: value });
						}
					};

					loginAccount(req, res);
				}))
			})
			.then((res) => {
				expect(res.status).to.equal(400);
				expect(res.content).to.deep.equal({
					errors: [
						{ descr: 'Wrong login credentials.' }
					]
				});
			});
	});

	it('returns error on wrong username', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then(() => {
				return (new Promise((resolve, reject) => {
					const req = {
						body: {
							userId: 'derfla',
							password: 'topsecret'
						}
					};
					const res = {
						status: (value) => { res.status = value; return res; },
						send: (value) => {
							resolve({ status: res.status, content: value });
						}
					};

					loginAccount(req, res);
				}))
			})
			.then((res) => {
				expect(res.status).to.equal(400);
				expect(res.content).to.deep.equal({
					errors: [
						{ descr: 'Wrong login credentials.' }
					]
				});
			});
	});

	it('returns multiple error from validation', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then(() => {
				return (new Promise((resolve, reject) => {
					const req = {
						body: {
							userId: 123,
							password: 123,
							blarf: 123
						}
					};
					const res = {
						status: (value) => { res.status = value; return res; },
						send: (value) => {
							resolve({ status: res.status, content: value });
						}
					};

					loginAccount(req, res);
				}))
			})
			.then((res) => {
				expect(res.status).to.equal(400);
				expect(res.content).to.deep.equal({
					errors: [
						{ descr: 'userId must be a string.' },
						{ descr: 'password must be a string.' },
						{ descr: 'Unknown data in body payload.' }
					]
				});
			});
	});

});

