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
		description: 'Connect to ws endpoint and trigger flow both on incoming message or websocket opening/closing',
		defaults: {
			name: 'Websocket Connection & Message',
		},
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Websocket URL',
				name: 'websocketUrl',
				type: 'string',
				default: '',
				placeholder: 'wss://example.com/',
				description: 'URL of the websocket server to connect to',
			},
			{
				displayName: 'Return WS Resource',
				name: 'returnWs',
				type: 'boolean',
				default: false,
				description: 'Whether to return ws resource. If you want to send back messages, this is required. However, your browser might freeze for a moment while displaying it in execution mode.',
			},
			{
				displayName: 'Send Initial Message',
				name: 'sendInitMessage',
				type: 'boolean',
				default: false,
				description: 'Whether to send message to server immediately upon connecting',
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

		let websocketUrl: string;
		let sendInitMessage: boolean;
		let returnWs: boolean;
		let initMessage : string;

		const startConsumer = async () => {
			try {
				websocketUrl = this.getNodeParameter('websocketUrl') as string;
				sendInitMessage = (this.getNodeParameter('sendInitMessage') || false) as boolean;
				returnWs = (this.getNodeParameter('returnWs') || false) as boolean;
				ws = new WebSocket(websocketUrl);

				ws.on('error', (error: {message: any;}) => {
					console.warn('[websocket-ws] connection error');

					const errorData = {
						message: 'WebSocket connection error',
						description: error.message,
					};
					throw new NodeApiError(this.getNode(), errorData);
				});

				ws.on('close', () => {
					this.emit([
						this.helpers.returnJsonArray([{
							event: 'close'
						}])
					]);
				});

				ws.on('message', (data: any, isBinary: boolean) => {
					console.debug('[websocket-ws] received new message');

					let message = isBinary ? data : data.toString();
					try {
						message = JSON.parse(message)
					} catch (exception) {
						console.warn('Unable to json parse websocket message: ' + message)
					}

					this.emit([
						this.helpers.returnJsonArray([
							{
								event: 'message',
								message,
								ws: returnWs ? ws : null,
							},
						]),
					]);
				});

				ws.on('open', () => {
					console.debug('[websocket-ws] connected');

					if(sendInitMessage) {
						initMessage = (this.getNodeParameter('initMessage') || '') as string;
						ws.send(initMessage)
					}

					this.emit([
						this.helpers.returnJsonArray([
							{
								event: 'open',
								ws: returnWs ? ws : null,
							},
						]),
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
