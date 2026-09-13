// Isolated probe: generation is stubbed; GETs target a local fixture server only.
const fs = require('node:fs');
const http = require('node:http');
const { createRequire } = require('node:module');
const assert = require('node:assert/strict');
const root = '/usr/local/lib/node_modules/n8n/node_modules/.pnpm';
const core = fs.readdirSync(root).find(n => n.startsWith('n8n-core@'));
const coreFile = `${root}/${core}/node_modules/n8n-core/dist/execution-engine/node-execution-context/utils/request-helpers/index.js`;
const req = createRequire(coreFile);
const { getRequestHelperFunctions } = require(coreFile);
const { stringify, parse } = req('flatted');
const { MaibaoApi } = require('./MaibaoApi.node.js');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
let gets = 0;
const server = http.createServer((request, response) => {
	gets++;
	assert.equal(request.headers.authorization, undefined);
	if (request.url.startsWith('/retry') && gets === 1) {
		response.writeHead(503, { 'content-type': 'application/json', 'x-request-id': 'download-busy' });
		response.end('{"error":"busy"}');
	} else if (request.url.startsWith('/forbidden')) {
		response.writeHead(403, { 'content-type': 'application/xml', 'x-amz-request-id': 'download-forbidden' });
		response.end('<Error><Code>AccessDenied</Code></Error>');
	} else {
		response.writeHead(200, { 'content-type': 'image/png' });
		response.end(png);
	}
});

(async () => {
	await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
	try {
		for (const scenario of ['retry', 'forbidden']) {
			gets = 0;
			let posts = 0;
			const url = `http://127.0.0.1:${server.address().port}/${scenario}?signature=fixture-private`;
			const parameters = { mode: 'image', imageModel: 'gpt-image-2', imageSize: '1024x1024', userPrompt: 'isolated probe' };
			const node = { name: 'IsolatedProbe', type: 'n8n-nodes-maibaoapi.maibaoApi', typeVersion: 1, position: [0, 0], parameters };
			const helpers = getRequestHelperFunctions({}, node, {});
			const context = {
				getInputData: () => [{ json: {} }], getNode: () => node,
				getNodeParameter: (key, _index, fallback) => parameters[key] ?? fallback,
				getCredentials: async () => ({ apiKey: 'fixture-private-key', baseUrl: 'https://generation.invalid/v1' }),
				continueOnFail: () => false,
				helpers: {
					httpRequest: async options => {
						if (options.method === 'POST') {
							posts++; return { body: { data: [{ url }] }, statusCode: 200, headers: { 'x-request-id': 'generation-fixture' } };
						}
						return helpers.httpRequest(options);
					},
					prepareBinaryData: async (buffer, fileName, mimeType) => ({ data: buffer.toString('base64'), fileName, mimeType }),
				},
			};
			try {
				const [items] = await new MaibaoApi().execute.call(context);
				assert.equal(scenario, 'retry'); assert.equal(posts, 1); assert.equal(gets, 2);
				assert.equal(items[0].json.imageUrl, url); assert.equal(items[0].binary.data.mimeType, 'image/png');
				console.log('PASS actual n8n helper: HTTP 503 -> retry -> PNG; one generation stub, two real GETs');
			} catch (error) {
				if (scenario !== 'forbidden') throw error;
				assert.equal(posts, 1); assert.equal(gets, 1);
				const restored = parse(stringify({ resultData: { error } })).resultData.error;
				assert.equal(restored.context.imageDownload.imageUrl, url);
				assert.equal(restored.context.imageDownload.generationStatusCode, 200);
				assert.equal(restored.context.imageDownload.attempts[0].statusCode, 403);
				assert.equal(restored.context.imageDownload.attempts[0].requestId, 'download-forbidden');
				assert.equal(restored.context.imageDownload.attempts[0].contentType, 'application/xml');
				assert.match(restored.description, /imageUrl/);
				assert.doesNotMatch(restored.message, /fixture-private/);
				assert.doesNotMatch(stringify(restored), /fixture-private-key/);
				console.log('PASS actual n8n error serialization: recoverable URL in context/description; 200 generation distinct from 403 download');
			}
		}
	} finally { server.closeAllConnections(); server.close(); }
})().catch(error => { console.error(error.name + ': ' + error.message); process.exitCode = 1; });
