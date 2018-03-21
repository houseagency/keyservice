function toStr(buf) {
	return buf.toString('base64')
		.split('+').join('-')
		.split('/').join('_')
		.split('=').join('')
}

module.exports = {
	toStr
};
