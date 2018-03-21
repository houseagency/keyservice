const expect = require('chai').expect;
const mem = require('../../src/storagebackends/mem'); 
const td = require('testdouble');

const passwordResetInit = require('../../src/handlers/passwordresetinit');
const passwordResetCommit = require('../../src/handlers/passwordresetcommit');
const users = require('../../src/users');
const errors = require('../../src/errors');

describe('handlers/passwordResetCommit()', () => {

	afterEach(() => mem.flush());

	it('should reset the password and return a new session', () => {

		return users.create([ 'alfred' ], 'topsecret')
			.then(accountId => {
				return users.createPasswordResetCode(accountId)
				.then(code => {

					return new Promise((resolve, reject) => {

						const req = {
							body: {
								code: code,
								password: 'abc123'
							}
						};
						const res = {
							status: (value) => { res.status = value; return res; },
							send: (value) => {
								resolve({ status: res.status, content: value });
							}
						};

						passwordResetCommit(req, res);

					});

				})

				.then((res) => {
					expect(res.status).to.equal(200);
					expect(res.content).to.be.an('object');
					expect(res.content.session).to.be.an('object');
					expect(res.content.session.id).to.be.a('string');
					expect(res.content.session.secret).to.be.a('string');
					expect(res.content.session.age).to.be.a('number');
				})
				
				.then(() => users.verifyPassword(accountId, 'topsecret'))
				.catch((err) => {
					return err;
				})
				.then((err) => {
					expect(err).to.be.instanceof(errors.WrongLoginCredentialsError);
				})
				
				.then(() => users.verifyPassword(accountId, 'abc123'))
				.then((verified) => {
					expect(verified).to.equal(true);
				});
			});
	});

	it('should get errors on invalid input', () => {
			return (new Promise((resolve, reject) => {
				const req = {
					body: {
						code: 123,
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

				passwordResetCommit(req, res);
			}))
				.then((res) => {
					expect(res.status).to.equal(400);
					expect(res.content).to.deep.equal({
						errors: [
							{ descr: 'password must be a string.' },
							{ descr: 'code must be a string.' },
							{ descr: 'Unknown data in body payload.' }
						]
					});
				});
	});

});
