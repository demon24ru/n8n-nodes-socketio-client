import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import {
	closeFields,
	closeOperations,
	messageFields,
	messageOperations
} from "./MessageDescription";

export class Websocket implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Websocket',
		name: 'websocket',
		icon: 'file:websocket.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ":" + $parameter["resource"]}}',
		description: 'Interact with ws stream',
		defaults: {
			name: 'Websocket',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Connection',
						value: 'connection',
					},
				],
				default: 'message',
			},
			...messageOperations,
			...messageFields,
			...closeOperations,
			...closeFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let resource: string;
		let operation: string;
		let websocketResource: string;

		for (let i = 0; i < items.length; i++) {
			try {
				resource = this.getNodeParameter('resource', 0);
				operation = this.getNodeParameter('operation', 0);
				websocketResource = this.getNodeParameter('websocketResource', 0) as string;

				if(!items[i].json[websocketResource]) {
					throw new NodeOperationError(
						this.getNode(),
						`Execution error: No websocket resource received`,
					);
				}

				if (resource === 'message') {
					if (operation === 'send') {
						const message = this.getNodeParameter('message', 0) as string;

						// @ts-ignore
						items[i].json[websocketResource]?.send(message);
					}
				} else if (resource === 'connection') {
					if (operation === 'close') {
						// @ts-ignore
						items[i].json[websocketResource]?.close();
					}
				}

				const toPush:any = {success: true};
				toPush[websocketResource] = items[i].json[websocketResource];

				returnData.push({json: toPush})
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
