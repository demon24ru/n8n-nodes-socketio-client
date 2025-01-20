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

export const closeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['connection'],
			},
		},
		options: [
			{
				name: 'Close Connection',
				value: 'close',
				description: 'Close websocket connection',
				action: 'Close websocket connection',
			},
		],
		default: 'close',
	},
];

export const messageFields: INodeProperties[] = [
	{
		displayName: 'Websocket Resource Field (Parameter Name)',
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

export const closeFields: INodeProperties[] = [
	{
		displayName: 'Websocket Resource Field (Parameter Name)',
		name: 'websocketResource',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['close'],
				resource: ['connection'],
			},
		},
		required: true,
		default: 'ws',
		description: 'WS resource field name given by trigger node',
	},
];
