import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MaibaoApi implements ICredentialType {
	name = 'maibaoApi';
	displayName = 'MaibaoAPI API';
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
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'hidden',
			default: 'https://api.maibao.chat/v1',
		},
	];
}