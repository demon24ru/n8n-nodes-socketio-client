import {
	INodeType,
	INodeTypeDescription,
	ITriggerFunctions,
	ITriggerResponse,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

import { io, Socket } from "socket.io-client";

export class WebsocketTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Websocket - Trigger',
		name: 'websocketTrigger',
		icon: 'file:websocket.svg',
		group: ['trigger'],
		version: 1,
		description: 'Connect to ws endpoint and trigger flow both on incoming message or websocket opening/closing',
		defaults: {
			name: 'SocketIO Connection & Message',
		},
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				displayName: 'SocketIO URL',
				name: 'websocketUrl',
				type: 'string',
				default: '',
				placeholder: 'http://localhost:5000',
				description: 'URL of the SocketIO server to connect to',
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
		let ws: Socket;

		let websocketUrl: string;
		let sendInitMessage: boolean;
		let returnWs: boolean;
		let initMessage : string;

		const startConsumer = async () => {
			try {
				websocketUrl = this.getNodeParameter('websocketUrl') as string;
				sendInitMessage = (this.getNodeParameter('sendInitMessage') || false) as boolean;
				returnWs = (this.getNodeParameter('returnWs') || false) as boolean;
				// Connect to the WebSocket server
				ws = io(websocketUrl, {
					reconnectionDelayMax: 10000,
				});
				ws.connect()

				ws.on('connect_error', (error: {message: any;}) => {
					console.warn('[socketio-client] connection error');

					const errorData = {
						message: 'SocketIO connection error',
						description: error.message,
					};
					throw new NodeApiError(this.getNode(), errorData);
				});

				ws.on('disconnect', () => {
					this.emit([
						this.helpers.returnJsonArray([{
							event: 'close'
						}])
					]);
				});

				ws.on('message', (data: any, isBinary: boolean) => {
					console.debug('[socketio-client] received new message');

					let message = isBinary ? data : data.toString();
					try {
						message = JSON.parse(message)
					} catch (exception) {
						console.warn('Unable to json parse SocketIO message: ' + message)
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

				ws.on('connect', () => {
					console.debug('[socketio-client] connected');

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
			ws.offAny();
			ws.disconnect();
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
