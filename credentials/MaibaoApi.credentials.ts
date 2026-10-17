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
	];
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://ai.maibao.chat/v1',
			url: '/models',
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}
