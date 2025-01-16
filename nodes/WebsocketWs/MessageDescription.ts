import type { INodeProperties } from 'n8n-workflow';

export const messageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['message'],
			},
		},
		options: [
			{
				name: 'Send Message',
				value: 'send',
				description: 'Send outbound message',
				action: 'Send outbound message',
			},
		],
		default: 'send',
	},
];

export const messageFields: INodeProperties[] = [
	{
		displayName: 'Websocket Resource',
		name: 'websocketResource',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['send'],
				resource: ['message'],
			},
		},
		required: true,
		default: 'ws',
		description: 'WS resource field name given by trigger node',
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'json',
		displayOptions: {
			show: {
				operation: ['send'],
				resource: ['message'],
			},
		},
		required: true,
		default: '{}',
		description: 'Message to send',
	},
];
