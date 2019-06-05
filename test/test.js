'use strict';

const assert = require('assert').strict;
const {dirname, join} = require('path');
const {inspect} = require('util');

const loadGhToken = require('..');
const test = require('testit');

process.chdir(__dirname);

test('get a GitHub token from the `GITHUB_TOKEN` environment variable if available', async () => {
	process.env.GITHUB_TOKEN = 'testtesttokentesttest';
	assert.equal(await loadGhToken(), 'testtesttokentesttest');
	delete process.env.GITHUB_TOKEN;
});

test('get a GitHub token from a file if available', async () => {
	assert.equal(await loadGhToken(), '0123456789');
});

test('fail when it cannot find GitHub token', async () => {
	process.chdir(dirname(__dirname));
	await assert.rejects(async () => loadGhToken(), {
		message: `Tried to get a personal access token for GitHub API from the \`GITHUB_TOKEN\` environment variable or a file at ${
			inspect(join(__dirname, '..', 'github-token.txt'))
		}, but neither exists.`
	});
	process.chdir(__dirname);
});

test('fail when the specified path is not a UTF-8 file', async () => {
	await assert.rejects(async () => loadGhToken({filePath: process.execPath}), {code: 'ERR_UNSUPPORTED_FILE_ENCODING'});
});

test('disallow a file to be zero byte', async () => {
	await assert.rejects(async () => loadGhToken({filePath: 'fixture-empty.txt'}), {
		message: `Expected a file at ${
			inspect(require.resolve('./fixture-empty.txt'))
		} to contain a personal access token for GitHub API, but it's an empty file.`
	});
});

test('disallow a file to be have no SLOC', async () => {
	await assert.rejects(async () => loadGhToken({filePath: 'fixture-whitespace-only.txt'}), {
		message: `Expected a file at ${
			inspect(require.resolve('./fixture-whitespace-only.txt'))
		} to contain a personal access token for GitHub API, but it has no SLOC (source line of code).`
	});
});

test('disallow a file to have leading whitespaces', async () => {
	await assert.rejects(async () => loadGhToken({filePath: 'fixture-leading-whitespace.txt'}), {
		message: `Expected a file at ${
			inspect(require.resolve('./fixture-leading-whitespace.txt'))
		} to contain a personal access token for GitHub API, but it begins with '\\n\\t'. Leading whitespaces are not allowed.`
	});
});

test('disallow a file to have more than 2 trailing newlines', async () => {
	await assert.rejects(async () => loadGhToken({filePath: 'fixture-double-trailing-newlines.txt'}), {
		message: `Expected a file at ${
			inspect(require.resolve('./fixture-double-trailing-newlines.txt'))
		} to contain a personal access token for GitHub API in a single line, but it has 2 newline characters. Only a single trailing newline is allowed.`
	});
});

test('fail when the argument is not a plain object', async () => {
	await assert.rejects(async () => loadGhToken(Symbol('_')), {
		name: 'TypeError',
		message: 'Expected an option object to set load-gh-token option, but got Symbol(_).'
	});
});

test('fail when `filePath` option is not a string', async () => {
	await assert.rejects(async () => loadGhToken({filePath: new Int32Array()}), {
		name: 'TypeError',
		message: 'Expected `filePath` option to be a <string>, but got a non-string value Int32Array [].'
	});
});

test('fail when `filePath` option is an empty string', async () => {
	await assert.rejects(async () => loadGhToken({filePath: ''}), {
		message: 'Expected `filePath` option to be a file path, but got \'\' (empty string).'
	});
});

test('fail when `filePath` option is a whitespace-only string', async () => {
	await assert.rejects(async () => loadGhToken({filePath: ' \r'}), {
		message: 'Expected `filePath` option to be a file path, but got a whitespace-only string \' \\r\'.'
	});
});

test('fail when it takes too many arguments', async () => {
	await assert.rejects(async () => loadGhToken({}, {}), {
		name: 'RangeError',
		message: 'Expected 0 or 1 argument ([<Object>]), but got 2 arguments.'
	});
});
