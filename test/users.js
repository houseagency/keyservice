const expect = require('chai').expect;
const td = require('testdouble')

const mem = require('../src/storagebackends/mem'); 
const users = require('../src/users'); 
const storage = require('../src/storage');

const errors = require('../src/errors');

describe('users', () => {

	afterEach(() => mem.flush());

	describe('create()', () => {

		it('will create one account blob and one blob for each login id', () => {

			return users.create([ 'test0' ], 'topsecret')
				.then(() => {
					const keys = Object.keys(mem._internal.data);
					expect(keys.length).to.equal(2);
				})
				.then(() => users.create([ 'test1', 'test2' ], 'qwerty123'))
				.then(() => {
					const keys = Object.keys(mem._internal.data);
					expect(keys.length).to.equal(5);
				});
		});

		it('will not create duplicates', () => {
			return users.create([ 'alfred' ], 'topsecret')
				.then(id => {
					expect(id).to.be.a('string');
				})
				.then(() => {
					const keys = Object.keys(mem._internal.data);
					expect(keys.length).to.equal(2);
				})
				.then(() => users.create([ 'alfred' ], 'qwerty123'))
				.catch((err) => {
					return err;
				})
				.then((err) => {
					expect(err).to.deep.equal({
						existsErrors: [
							{
								descr: 'User ID exists.',
								userId: 'alfred'
							}
						]
					});
				})
				.then(() => {
					const keys = Object.keys(mem._internal.data);
					expect(keys.length).to.equal(2);
				})
				
		});

	});

	describe('del()', () => {

		it('will remove all blobs related to a user', () => {
			return users.create([ 'test0' ], 'topsecret')
				.then((accountId) => users.del(accountId))
				.then(() => {
					const keys = Object.keys(mem._internal.data);
					expect(keys.length).to.equal(0);
				});
		});
	});

	describe('verifyPassword()', () => {

		it('will resolve true on matching password', () => {
			return users.create([ 'johndoe' ], 'supersecret')
				.then((accountId) => users.verifyPassword(accountId, 'supersecret'))
				.then((matching) => {
					expect(matching).to.equal(true);
				});
		});

		it('will throw on not matching password', () => {
			return users.create([ 'johndoe' ], 'supersecret')
				.then((accountId) => users.verifyPassword(accountId, 'topsecret'))
				.catch((err) => { return err; })
				.then((err) => {
					expect(err).to.be.instanceof(errors.WrongLoginCredentialsError);
				});
		});

	});

	describe('updatePassword()', () => {
		it('should change the password on the account', () => {
			return users.create([ 'johndoe' ], 'supersecret')
				.then((accountId) => {
					return users.updatePassword(accountId, 'topsecret')
						.then(() => users.verifyPassword(accountId, 'topsecret'))
						.then((matching) => {
							expect(matching).to.equal(true);
						})
						.then(() => users.verifyPassword(accountId, 'supersecret'))
						.catch((err) => { return err; })
						.then((err) => {
							expect(err).to.be.instanceof(errors.WrongLoginCredentialsError);
						});
				});
		});
	});

	describe('loginIdToAccountId()', () => {
		it('should return the same account id as create() did', () => {
			return users.create([ 'johndoe' ], 'supersecret')
				.then((accountId) => {
					return users.loginIdToAccountId('johndoe')
						.then((id) => {
							expect(accountId).to.equal(id);
						});
				});
		});
	});

	describe('updateLoginIds()', () => {

		it('should change login-to-account mapping', () => {
			return users.create([ 'alfred' ], 'blarf')
				.then((accountId) => {
					return users.updateLoginIds(accountId, [ 'derfla' ])
						.then(() => users.loginIdToAccountId('derfla'))
						.then((id) => {
							expect(accountId).to.equal(id);
						});
				})
		});

		it('should delete previous login-to-account mapping', () => {
			return users.create([ 'alfred' ], 'blarf')
				.then((accountId) => users.updateLoginIds(accountId, [ 'derfla' ]))
				.then(() => users.loginIdToAccountId('alfred'))
				.catch((err) => {
					return err;
				})
				.then((err) => {
					expect(err).to.be.instanceOf(
						errors.AccountDoesNotExistError
					);
				});
		});

		it('should delete old login blobs', () => {
			return users.create([ 'alfred', 'affe' ], 'blarf')
				.then((accountId) => {
					const keys = Object.keys(mem._internal.data);
					expect(keys.length).to.equal(3);

					return users.updateLoginIds(accountId, [ 'alfred' ])
						.then(() => {
							const keys = Object.keys(mem._internal.data);
							expect(keys.length).to.equal(2);
						})
						.then(() => {
							// Now... Did it delete the right one?
						
							return users.loginIdToAccountId('alfred')
								.then(() => 'it deleted the right one!');
						})
						.catch((err) => 'error. wrong file deleted.')
						.then((status) => {
							expect(status).to.equal('it deleted the right one!');
						});
				});
		});

		it('should update the user object with new loginids', () => {
			return users.create([ 'alfred', 'affe' ], 'topsecret')
				.then((accountId) => {
					const newLoginIds = [
						'alfred',
						'afo',
						'alf',
						'pasta alfredo'
					];
					return users.updateLoginIds(accountId, newLoginIds)
					.then(() => storage.get('/users/' + accountId))
					.then((data) => JSON.parse(data.toString()))
					.then((data) => {
						const hashedNewLoginIds =
							newLoginIds.map(
								(loginId) => users._internal.hashLoginId(loginId)
							);
						expect(data.loginIds).to.deep.equal(hashedNewLoginIds);
					});

				});
		});

	});

	describe('createPasswordResetCode()/passwordResetCodeToAccountId()', () => {
		it('should be able to create reset code, and then resolve accountid once', () => {
			return users.create([ 'alfred' ], 'topsecret')
				.then((accountId) => {
					return users.createPasswordResetCode(accountId)
						.then((code) => {
							return users.passwordResetCodeToAccountId(code)
								.then((id) => {
									expect(id).to.equal(accountId);
								})
								.then(() => users.passwordResetCodeToAccountId(code))
								.catch((err) => {
									return err
								})
								.then((err) => {
									expect(err).to.be.instanceOf(
										errors.ResetCodeInvalidError
									);
								});
						});
				});
		});
	});

});
