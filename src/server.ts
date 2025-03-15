import cluster, { Worker } from 'node:cluster';
import http from 'node:http';
import { ConfigSchemaType, rootConfigSchema } from './config-schema';
import {
	WorkerMessageType,
	WorkerResponseMessageType,
	workerResponseSchema,
	workerRootSchema,
} from './worker-schema';

interface CreateServerConfig {
	port: number;
	workerCount: number;
	config: ConfigSchemaType;
}

export async function createServer(config: CreateServerConfig) {
	const { port, workerCount, config: serverConfig } = config;

	const WORKER_POOL: Worker[] = [];

	if (cluster.isPrimary) {
		console.log('LOG: Spawned master process');

		for (let i = 0; i < workerCount; i++) {
			const worker = cluster.fork({ config: JSON.stringify(serverConfig) });
			WORKER_POOL.push(worker);
			console.log(`LOG: Forked worker ${i}`);
		}

		const server = http.createServer(function (req, res) {
			const index = Math.floor(Math.random() * WORKER_POOL.length);
			const worker = WORKER_POOL.at(index);

			if (!worker) {
				throw new Error('Worker not found');
			}

			const payload: WorkerMessageType = {
				url: req.url as string,
				headers: req.headers,
				body: null,
				requestType: 'HTTP',
			};

			worker.send(JSON.stringify(payload));

			worker.on('message', async (message) => {
				const validatedMessage = await workerResponseSchema.parseAsync(
					JSON.parse(message),
				);

				if (validatedMessage.errorCode) {
					res.writeHead(parseInt(validatedMessage.errorCode));
					res.end(validatedMessage.error);
					return;
				}

				res.writeHead(200);
				res.end(validatedMessage.data);
				return;
			});
		});

		server.listen(port, () => {
			console.log(`Server is running on http://localhost:${port} 🚀`);
		});
	}

	if (cluster.isWorker) {
		console.log(`LOG: Spawned worker ${process.pid}`);
		const workerConfig = await rootConfigSchema.parseAsync(
			JSON.parse(process.env.config as string),
		);

		process.on('message', async (message: string) => {
			const validatedMessage = await workerRootSchema.parseAsync(
				JSON.parse(message),
			);

			const requestUrl = validatedMessage.url;

			// Find the rule that matches the request URL.
			const rule = workerConfig.server.rules.find((rule) => {
				const regex = new RegExp(`^${rule.path}.*$`);
				return regex.test(requestUrl);
			});

			if (!rule) {
				const reply: WorkerResponseMessageType = {
					error: 'Rule not found!',
					errorCode: '404',
				};
				return process.send?.(JSON.stringify(reply));
			}

			// Randomly select an upstream to proxy the request to.
			const upstreamId = rule.upstreams.at(
				Math.floor(Math.random() * rule.upstreams.length),
			);

			if (!upstreamId) {
				const reply: WorkerResponseMessageType = {
					error: 'Upstream not found!',
					errorCode: '500',
				};
				return process.send?.(JSON.stringify(reply));
			}

			// Find the corresponding upstream configuration.
			const upstream = workerConfig.server.upstreams.find(
				(upstream) => upstream.id === upstreamId,
			);

			// Reverse proxy the request to the upstream.
			const request = http.request(
				{ host: upstream?.url, path: requestUrl },
				(proxyResponse) => {
					let data = '';

					proxyResponse.on('data', (chunk) => {
						data += chunk;
					});

					proxyResponse.on('end', () => {
						const reply: WorkerResponseMessageType = {
							data,
						};

						// Send the response back to the master process.
						process.send?.(JSON.stringify(reply));
					});
				},
			);

			request.end();
		});
	}
}
