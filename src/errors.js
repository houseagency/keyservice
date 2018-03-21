class CustomError extends Error {
	constructor(...args) {
		super(...args);
		Error.captureStackTrace(this, CustomError);
	}
};

class AccountDoesNotExistError extends CustomError { };
class AuthHeaderError extends CustomError { };
class DecryptionFailedError extends CustomError { };
class ResetCodeInvalidError extends CustomError { };
class StoredDataDoesNotExistError extends CustomError { };
class WrongLoginCredentialsError extends CustomError { };

module.exports = {
	AccountDoesNotExistError,
	AuthHeaderError,
	DecryptionFailedError,
	ResetCodeInvalidError,
	StoredDataDoesNotExistError,
	WrongLoginCredentialsError
};
