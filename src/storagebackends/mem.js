const errors = require('../errors');

const data = {};

function del(path) {
	return new Promise((resolve, reject) => {
		if (typeof data[path] !== 'undefined') {
			delete data[path];
		}
		resolve();
	});
}

function exists(path) {
	return new Promise((resolve, reject) => {
		resolve(typeof data[path] !== 'undefined');
	});
}

function flush() {
	return new Promise((resolve, reject) => {
		Object.keys(data).forEach((key) => delete data[key]);
		resolve();
	});
}

function get(path) {
	return new Promise((resolve, reject) => {
		if (typeof data[path] === 'undefined') {
			reject(new errors.StoredDataDoesNotExistError());
		}
		resolve(data[path]);
	});
}

function put(path, val) {
	return new Promise((resolve, reject) => {
		data[path] = val;
		resolve();
	});
}

module.exports = {
	del,
	exists,
	flush,
	get,
	put,
	_internal: {
		data
	}
};
