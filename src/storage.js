const { toStr } = require('./buffertool');

const crypto = require('crypto');
const encryptionKey = 'LOAU140Gf5T6c0mki7P9wo8PpaZejtVfZhbG2dgShhOClK9jfiwOCU';
const fileHashSalt = 'oLb4t9YbWySty3xCO5YrpGubv4ShFFdgZJi0FYDuyRg6XjeykhwOLuO';
const embeddedEncryptionSalt = 'qqEsDnCLx0VLMMp91y5mOHXoAxtDXpv6V27rR3szPcNlY';

const errors = require('./errors');

const gcs = require('./storagebackends/gcs');
const mem = require('./storagebackends/mem');

const backend = process.env.GCLOUD_PROJECT ? gcs() : mem;

function decrypt(data, path) {

	try {

		const decipher = crypto.createDecipher('camellia256', encryptionKey);
		const embedded = Buffer.concat([
			decipher.update(data),
			decipher.final()
		]);

		const embeddedDecipher =
			crypto.createDecipher('seed', embeddedCryptoKey(path));
		return Buffer.concat([
			embeddedDecipher.update(embedded),
			embeddedDecipher.final()
		]);

	} catch (err) {
		throw new errors.DecryptionFailedError();
	}

}

function encrypt(data, path) {
	
	// First encrypt content with a key based of the path,
	// just to make it impossible to hack things by changing filenames:
	
	const embeddedCipher = crypto.createCipher('seed', embeddedCryptoKey(path));
	const embedded = Buffer.concat([
		embeddedCipher.update(data),
		embeddedCipher.final()
	]);

	const cipher = crypto.createCipher('camellia256', encryptionKey);
	return Buffer.concat([ cipher.update(embedded), cipher.final() ]);
}

function del(path) {
	const hashedPath = hashPath(path);
	return backend.del(hashedPath);
}

function exists(path) {
	const hashedPath = hashPath(path);
	return backend.exists(hashedPath);
}

function get(path) {
	const hashedPath = hashPath(path);
	return backend.get(hashedPath)
		.then((buf) => {
			const time = buf.readUInt32BE(0);
			if (time > 0 && time < Math.floor((new Date()).getTime() / 1000)) {

				return backend.del(hashedPath)
					.then(() => {
						throw new errors.StoredDataDoesNotExistError();
					})

			}
			return buf.slice(4);
		})
		.then(data => {
			return decrypt(data, path);
		});
}

function put(path, data, ttl) {
	const hashedPath = hashPath(path);

	// IMPORTANT:
	// The second parameter to encrypt() must be the path, not the hashedPath!
	// You should not be able to calculate the encryption key from the hashed
	// path.

	const time = ttl ? Math.round(((new Date()).getTime() / 1000) + ttl) : 0; 
	const timeBuf = new Buffer(4);
	timeBuf.writeUInt32BE(time, 0);

	return backend.put(hashedPath,
		Buffer.concat([
			timeBuf,
			encrypt(
				Buffer.from(data),
				path
			)
		])
	);
}

function embeddedCryptoKey(path) {
	return toStr(
		crypto.createHmac('sha512', embeddedEncryptionSalt)
			.update(new Buffer(path, 'utf-8'))
			.digest()
	);
}

function hashPath(path) {
	return toStr(
		crypto.createHmac('sha512', fileHashSalt)
			.update(new Buffer(path, 'utf-8'))
			.digest()
	);
}

module.exports = {
	del,
	exists,
	get,
	put,
	_internal: {
		decrypt,
		encrypt
	}
};
