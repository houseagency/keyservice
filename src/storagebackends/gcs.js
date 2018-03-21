const crypto = require('crypto');

const errors = require('../errors');

const Storage = require('@google-cloud/storage');

const projectId = 'keyservice-195412';
const bucketName = 'keyservice';

const serverSideSalt = 'lEYW8WbCXfk6hkrQoLTxvhWAepU7AuaFqrwWazs40fUjgbn9oZM5m';

let storage, bucket;

function del(path) {
	const file = bucket.file(path);
	return file.delete().then(data => data[0]);
}

function exists(path) {
	const file = bucket.file(path);
	return file.exists().then(data => data[0]);
}

function get(path) {
	const file = bucket.file(path);
	file.setEncryptionKey(serverSideEncryptionKey(path));
	return file.download().then(data => data[0]);
}

function put(path, val) {
	const file = bucket.file(path);
	file.setEncryptionKey(serverSideEncryptionKey(path));
	return file.save(val);
}

function serverSideEncryptionKey(path) {
	return crypto.createHmac('sha256', serverSideSalt)
		.update(new Buffer(path, 'utf-8'))
		.digest();
}

module.exports = function() {

	storage = new Storage({
		projectId: projectId
	});
	bucket = storage.bucket(bucketName);

	return {
		del,
		exists,
		get,
		put
	};
};
