import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// import WebSocket from 'ws';

import {
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
				],
				default: 'message',
			},
			...messageOperations,
			...messageFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let resource: string;
		let operation: string;

		// For Post
		let body: IDataObject;
		// For Query string
		let qs: IDataObject;

		let requestMethod: IHttpRequestMethods;
		let endpoint: string;
		let returnAll = false;
		let dataKey: string | undefined;

		for (let i = 0; i < items.length; i++) {
			try {
				dataKey = undefined;
				resource = this.getNodeParameter('resource', 0);
				operation = this.getNodeParameter('operation', 0);

				requestMethod = 'GET';
				endpoint = '';
				body = {} as IDataObject;
				qs = {} as IDataObject;

				console.log(body, qs, requestMethod, endpoint, returnAll, dataKey);

				if (resource === 'message') {
					if (operation === 'send') {
						// ----------------------------------
						//         contact:create
						// ----------------------------------

						// requestMethod = 'POST';
						//
						// const updateIfExists = this.getNodeParameter('updateIfExists', i) as boolean;
						// if (updateIfExists) {
						// 	endpoint = '/api/3/contact/sync';
						// } else {
						// 	endpoint = '/api/3/contacts';
						// }
						//
						// dataKey = 'contact';
						//
						// body.contact = {
						// 	email: this.getNodeParameter('email', i) as string,
						// } as IDataObject;
						//
						// const additionalFields = this.getNodeParameter('additionalFields', i);
						// addAdditionalFields(body.contact as IDataObject, additionalFields);
					}
				}

				// let responseData;
				// if (returnAll) {
				// 	responseData = await activeCampaignApiRequestAllItems.call(
				// 		this,
				// 		requestMethod,
				// 		endpoint,
				// 		body,
				// 		qs,
				// 		dataKey,
				// 	);
				// } else {
				// 	responseData = await activeCampaignApiRequest.call(
				// 		this,
				// 		requestMethod,
				// 		endpoint,
				// 		body,
				// 		qs,
				// 		dataKey,
				// 	);
				// }
				//
				// if (resource === 'contactList' && operation === 'add' && responseData === undefined) {
				// 	responseData = { success: true };
				// }
				//
				// const executionData = this.helpers.constructExecutionMetaData(
				// 	this.helpers.returnJsonArray(responseData as IDataObject[]),
				// 	{ itemData: { item: i } },
				// );
				//
				// returnData.push(...executionData);
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
