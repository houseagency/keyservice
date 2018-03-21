const expect = require('chai').expect;
const mem = require('../../src/storagebackends/mem'); 
const td = require('testdouble');

const createAccount = require('../../src/handlers/createaccount');
const sessions = require('../../src/sessions');
const users = require('../../src/users');

describe('handlers/createAccount()', () => {

	afterEach(() => mem.flush());

	it('should create new account and respond with new session', () => {

		return (new Promise((resolve, reject) => {
			const req = {
				body: {
					userIds: [ 'alfred' ],
					password: 'topsecret'
				}
			};
			const res = {
				status: (value) => { res.status = value; return res; },
				send: (value) => {
					resolve({ status: res.status, content: value });
				}
			};

			createAccount(req, res);
		}))
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

	it('should respond with error on duplicate userid(s)', () => {
		return users.create([ 'aaaffe', 'alfred', 'afo' ], 'topsecret')
			.then(() => {

				return (new Promise((resolve, reject) => {
					const req = {
						body: {
							userIds: [ 'alfred', 'afo', 'affe' ],
							password: 'topsecret'
						}
					};
					const res = {
						status: (value) => { res.status = value; return res; },
						send: (value) => {
							resolve({ status: res.status, content: value });
						}
					};

					createAccount(req, res);
				}))

			})
			.then((res) => {
				expect(res.status).to.equal(400);
				expect(res.content).to.deep.equal({
					errors: [
						{ descr: 'User ID exists.', userId: 'alfred' },
						{ descr: 'User ID exists.', userId: 'afo' }
					]
				});
			})
	});

	it('should respond with error on invalid password', () => {
		return (new Promise((resolve, reject) => {
			const req = {
				body: {
					userIds: [ 'alfred', 'afo', 'affe' ],
					password: 123
				}
			};
			const res = {
				status: (value) => { res.status = value; return res; },
				send: (value) => {
					resolve({ status: res.status, content: value });
				}
			};

			createAccount(req, res);
		}))
			.then((res) => {
				expect(res.status).to.equal(400);
				expect(res.content).to.deep.equal({
					errors: [
						{ descr: 'Password must be a string.' }
					]
				});
			})
	});

	it('should respond with error on invalid userid', () => {
		return (new Promise((resolve, reject) => {
			const req = {
				body: {
					userIds: [ 'alfred', 123, 'affe' ],
					password: 'abc'
				}
			};
			const res = {
				status: (value) => { res.status = value; return res; },
				send: (value) => {
					resolve({ status: res.status, content: value });
				}
			};

			createAccount(req, res);
		}))
			.then((res) => {
				expect(res.status).to.equal(400);
				expect(res.content).to.deep.equal({
					errors: [
						{ descr: 'All userIds must be strings.', userId: 123 }
					]
				});
			})
	});

	it('can respond with many error messsages at once.', () => {
		return (new Promise((resolve, reject) => {
			const req = {
				body: {
					userIds: 'alfred',
					password: 123,
					random: 'scheisse'
				}
			};
			const res = {
				status: (value) => { res.status = value; return res; },
				send: (value) => {
					resolve({ status: res.status, content: value });
				}
			};

			createAccount(req, res);
		}))
			.then((res) => {
				expect(res.status).to.equal(400);
				expect(res.content).to.deep.equal({
					errors: [
						{ descr: 'Password must be a string.' },
						{ descr: 'userIds must be an array with values.' },
						{ descr: 'Unknown data in body payload.' }
					]
				});
			})
	});

});


