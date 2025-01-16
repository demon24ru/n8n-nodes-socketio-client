import {
	INodeType,
	INodeTypeDescription,
	ITriggerFunctions,
	ITriggerResponse,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';
import WebSocket from 'ws';

export class WebsocketTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Websocket - Trigger',
		name: 'websocketTrigger',
		icon: 'file:websocket.svg',
		group: ['trigger'],
		version: 1,
		description: 'Connect to ws endpoint and trigger flow both on connection or incoming message',
		defaults: {
			name: 'Websocket Connection & Message',
		},
		inputs: [],
		outputs: ['main', 'main'],
		outputNames: ['message', 'connection'],
		properties: [
			{
				displayName: 'Websocket URL',
				name: 'websocketUrl',
				type: 'string',
				default: '',
				placeholder: 'wss://example.com/',
				description: 'The URL of the websocket server to connect to',
			},
			{
				displayName: 'Send Initial Message',
				name: 'sendInitMessage',
				type: 'boolean',
				default: false,
				description: 'Whether to send message immediately upon connecting',
			},
			{
				displayName: 'Initial Message',
				name: 'initMessage',
				type: 'string',
				displayOptions: {
					show: {
						sendInitMessage: [true],
					},
				},
				required: true,
				default: '{}',
				description: 'Message to send',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		let ws: any = null;

		const startConsumer = async () => {
			try {
				const websocketUrl = this.getNodeParameter('websocketUrl') as string;
				const sendInitMessage = this.getNodeParameter('sendInitMessage') as boolean;
				const initMessage = this.getNodeParameter('initMessage') as string;
				ws = new WebSocket(websocketUrl);

				ws.on('error', (error: {
					message: any;
				}) => {
					const errorData = {
						message: 'WebSocket connection error',
						description: error.message,
					};
					throw new NodeApiError(this.getNode(), errorData);
				});

				ws.on('message', (data: any, isBinary: boolean) => {
					let message = isBinary ? data : data.toString();
					try {
						message = JSON.parse(message)
					} catch (exception) {
						console.warn('Unable to json parse websocket message: ' + message)
					}

					this.emit([
						this.helpers.returnJsonArray([
							{
								message,
								ws,
							},
						]),
						this.helpers.returnJsonArray([
							{
								ws,
							},
						])
					]);
				});

				ws.on('open', () => {
					console.log('[WS] connected');

					if(sendInitMessage) {
						ws.send(initMessage)
					}

					this.emit([
						this.helpers.returnJsonArray([]),
						this.helpers.returnJsonArray([
							{
								ws,
							},
						])
					]);
				})
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Execution error: ${error.message}`,
				);
			}
		}

		await startConsumer();

		// The "closeFunction" function gets called by n8n whenever
		// the workflow gets deactivated and can so clean up.
		async function closeFunction() {
			ws.terminate();
		}

		// The "manualTriggerFunction" function gets called by n8n
		// when a user is in the workflow editor and starts the
		// workflow manually. So the function has to make sure that
		// the emit() gets called with similar data like when it
		// would trigger by itself so that the user knows what data
		// to expect.
		async function manualTriggerFunction() {
			await startConsumer();
		}

		return {
			closeFunction,
			manualTriggerFunction,
		};

	}
}
