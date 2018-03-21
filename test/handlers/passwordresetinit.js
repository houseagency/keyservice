const expect = require('chai').expect;
const mem = require('../../src/storagebackends/mem'); 
const td = require('testdouble');

const passwordResetInit = require('../../src/handlers/passwordresetinit');
const users = require('../../src/users');

describe('handlers/passwordResetInit()', () => {

	afterEach(() => mem.flush());

	it('should trigger a request with reset code to some external URL', () => {

		td.replace(users, 'postPasswordResetCode');

		return users.create([ 'alfred' ], 'topsecret')
			.then(() => {
				return (new Promise((resolve, reject) => {
					const req = {
						body: {
							userId: 'alfred',
							trackId: '0123456789'
						}
					};
					const res = {
						status: (value) => { res.status = value; return res; },
						send: (value) => {
							resolve({ status: res.status, content: value });
						}
					};

					passwordResetInit(req, res);
				}))
			})
			.then((res) => {
				expect(res.status).to.equal(200);
				expect(res.content).to.deep.equal({});
				td.verify(users.postPasswordResetCode(), { ignoreExtraArgs: true, times: 1 });
				td.reset();
			});
	});

	it('should get errors on invalid input', () => {
		return users.create([ 'alfred' ], 'topsecret')
			.then(() => {
				return (new Promise((resolve, reject) => {
					const req = {
						body: {
							userId: 123,
							trackId: 123,
							blarf: 123
						}
					};
					const res = {
						status: (value) => { res.status = value; return res; },
						send: (value) => {
							resolve({ status: res.status, content: value });
						}
					};

					passwordResetInit(req, res);
				}))
			})
			.then((res) => {
				expect(res.status).to.equal(400);
				expect(res.content).to.deep.equal({
					errors: [
						{ descr: 'userId must be a string.' },
						{ descr: 'trackId must be a string.' },
						{ descr: 'Unknown data in body payload.' }
					]
				});
			});
	});

});
