'use strict';

const {inspect} = require('util');
const {join, resolve} = require('path');

const loadGhToken = require('..');
const test = require('tape');

test('loadGhToken()', async t => {
	async function getError(...args) {
		try {
			return await loadGhToken(...args);
		} catch (err) {
			return err;
		}
	}

	process.env.GITHUB_TOKEN = 'testtesttokentesttest';

	t.equal(
		await loadGhToken(),
		'testtesttokentesttest',
		'should get a GitHub token from the `GITHUB_TOKEN` environment variable if available.'
	);

	delete process.env.GITHUB_TOKEN;

	t.equal(
		(await getError()).message,
		`Tried to get a personal access token for GitHub API from the \`GITHUB_TOKEN\` environment variable or a file at ${
			inspect(join(__dirname, '..', 'github-token.txt'))
		}, but neither exists.`,
		'should fail when it cannot find GitHub token.'
	);

	process.chdir(__dirname);

	t.equal(
		await loadGhToken(),
		'0123456789',
		'should get a GitHub token from a file if available.'
	);

	t.equal(
		(await getError({filePath: __dirname})).code,
		'EISDIR',
		'should fail when the specified path is not a file.'
	);

	t.equal(
		(await getError({filePath: 'fixture-empty.txt'})).message,
		`Expected a file at ${
			inspect(resolve('fixture-empty.txt'))
		} to contain a personal access token for GitHub API, but it's an empty file.`,
		'should disallow a file to be zero byte.'
	);

	t.equal(
		(await getError({filePath: 'fixture-whitespace-only.txt'})).message,
		`Expected a file at ${
			inspect(resolve('fixture-whitespace-only.txt'))
		} to contain a personal access token for GitHub API, but it has no SLOC (source line of code).`,
		'should disallow a file to be have no SLOC.'
	);

	t.equal(
		(await getError({filePath: 'fixture-leading-whitespace.txt'})).message,
		`Expected a file at ${
			inspect(resolve('fixture-leading-whitespace.txt'))
		} to contain a personal access token for GitHub API, but it begins with '\\n\\t'. Leading whitespaces are not allowed.`,
		'should disallow a file to have leading whitespaces.'
	);

	t.equal(
		(await getError({filePath: 'fixture-double-trailing-newlines.txt'})).message,
		`Expected a file at ${
			inspect(resolve('fixture-double-trailing-newlines.txt'))
		} to contain a personal access token for GitHub API in a single line, but it has 2 newline characters. Only a single trailing newline is allowed.`,
		'should disallow a file to have more than 2 trailing newlines.'
	);

	t.equal(
		(await getError(Symbol('_'))).toString(),
		'TypeError: Expected an option object to set load-gh-token option, but got Symbol(_).',
		'should fail when the argument is not a plain object.'
	);

	t.equal(
		(await getError({filePath: new Int32Array()})).toString(),
		'TypeError: Expected `filePath` option to be a <string>, but got a non-string value Int32Array [].',
		'should fail when `filePath` option is not a plain object.'
	);

	t.equal(
		(await getError({filePath: ''})).toString(),
		'Error: Expected `filePath` option to be a file path, but got \'\' (empty string).',
		'should fail when `filePath` option is an empty string.'
	);

	t.equal(
		(await getError({filePath: ' \r'})).toString(),
		'Error: Expected `filePath` option to be a file path, but got a whitespace-only string \' \\r\'.',
		'should fail when `filePath` option is a whitespace-only string.'
	);

	t.equal(
		(await getError({}, {})).toString(),
		'RangeError: Expected 0 or 1 argument ([<Object>]), but got 2 arguments.',
		'should fail when it takes too many arguments.'
	);

	t.end();
});
