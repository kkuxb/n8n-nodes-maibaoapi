const test = require('node:test');
const assert = require('node:assert/strict');

const { MaibaoApi } = require('../dist/credentials/MaibaoApi.credentials.js');

test('API 地址凭证字段提供两个可选域名并默认使用 AI 域名', () => {
	const credential = new MaibaoApi();
	const baseUrl = credential.properties.find((property) => property.name === 'baseUrl');

	assert.ok(baseUrl);
	assert.equal(baseUrl.type, 'options');
	assert.deepEqual(baseUrl.options, [
		{
			name: 'https://api.maibao.chat',
			value: 'https://api.maibao.chat/v1',
		},
		{
			name: 'https://ai.maibao.chat',
			value: 'https://ai.maibao.chat/v1',
		},
	]);
	assert.equal(baseUrl.default, 'https://ai.maibao.chat/v1');
});
