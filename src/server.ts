import cluster, { Worker } from 'node:cluster';
import http from 'node:http';
import { ConfigSchemaType, rootConfigSchema } from './config-schema';
import { WorkerMessageType, workerRootSchema } from './worker-schema';

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

		process.on('message', async (message) => {
			const validatedMessage = await workerRootSchema.parseAsync(
				JSON.parse(message as string),
			);
		});
	}
}
