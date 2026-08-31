import { ICredentialType, INodeProperties, ICredentialTestRequest } from 'n8n-workflow';

export class MaibaoApi implements ICredentialType {
	name = 'maibaoApi';
	displayName = 'MaibaoAPI API';
	icon = { light: 'file:maibaoapi.svg', dark: 'file:maibaoapi.svg' } as const;
	documentationUrl = 'https://maibaoapi.apifox.cn/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'API 地址',
			name: 'baseUrl',
			type: 'options',
			options: [
				{
					name: 'https://api.maibao.chat',
					value: 'https://api.maibao.chat/v1',
				},
				{
					name: 'https://ai.maibao.chat',
					value: 'https://ai.maibao.chat/v1',
				},
			],
			default: 'https://ai.maibao.chat/v1',
		},
	];
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/models',
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}
