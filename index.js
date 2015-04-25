'use strict';

const {inspect} = require('util');
const {resolve} = require('path');

const inspectWithKind = require('inspect-with-kind');
const isPlainObj = require('is-plain-obj');
const readUtf8File = require('read-utf8-file');

const ENV_KEY = 'GITHUB_TOKEN';
const DEFAULT_FILENAME = 'github-token.txt';
const target = 'a personal access token for GitHub API';

module.exports = async function loadGhToken(...args) {
	const argLen = args.length;
	const [option = {}] = args;

	if (argLen === 1) {
		if (!isPlainObj(option)) {
			throw new TypeError(`Expected an option object to set load-gh-token option, but got ${
				inspectWithKind(option)
			}.`);
		}

		if (typeof option.filePath !== 'string') {
			throw new TypeError(`Expected \`filePath\` option to be a <string>, but got a non-string value ${
				inspectWithKind(option.filePath)
			}.`);
		}

		if (option.filePath.length === 0) {
			throw new Error('Expected `filePath` option to be a file path, but got \'\' (empty string).');
		}

		if (option.filePath.trim().length === 0) {
			throw new Error(`Expected \`filePath\` option to be a file path, but got a whitespace-only string ${
				inspect(option.filePath)
			}.`);
		}
	} else if (argLen > 1) {
		throw new RangeError(`Expected 0 or 1 argument ([<Object>]), but got ${argLen} arguments.`);
	}

	if (process.env[ENV_KEY]) {
		return process.env[ENV_KEY];
	}

	const path = resolve(option.filePath || DEFAULT_FILENAME);
	let contents;

	try {
		contents = await readUtf8File(path);
	} catch (err) {
		if (err.code === 'ENOENT') {
			const error = new Error(`Tried to get ${target} from the \`${ENV_KEY}\` environment variable or a file at ${
				inspect(path)
			}, but neither exists.`);
			error.code = 'ERR_NO_GITHUB_TOKEN';

			throw error;
		}

		throw err;
	}

	if (contents.length === 0) {
		throw new Error(`Expected a file at ${inspect(path)} to contain ${target}, but it's an empty file.`);
	}

	if (contents.trim().length === 0) {
		throw new Error(`Expected a file at ${inspect(path)} to contain ${target}, but it has no SLOC (source line of code).`);
	}

	const whitespace = contents.match(/^\s+/u);

	if (whitespace) {
		throw new Error(`Expected a file at ${inspect(path)} to contain ${target}, but it begins with ${
			inspect(whitespace[0])
		}. Leading whitespaces are not allowed.`);
	}

	const newlines = contents.match(/\n/ug);

	if (newlines && newlines.length > 1) {
		throw new Error(`Expected a file at ${inspect(path)} to contain ${target} in a single line, but it has ${
			newlines.length
		} newline characters. Only a single trailing newline is allowed.`);
	}

	return contents.trim();
};

Object.defineProperties(module.exports, {
	ENV_KEY: {
		value: ENV_KEY,
		enumerable: true
	},
	DEFAULT_FILENAME: {
		value: DEFAULT_FILENAME,
		enumerable: true
	}
});
