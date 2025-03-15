import { program } from 'commander';
import { parseYAMLConfig, validatedConfig } from './config';
import cluster from 'node:cluster';
import http from 'node:http';
import os from 'node:os';
import { ConfigSchemaType, rootConfigSchema } from './config-schema';

interface CreateServerConfig {
	port: number;
	workerCount: number;
	config: ConfigSchemaType;
}

async function createServer(config: CreateServerConfig) {
	const { port, workerCount, config: serverConfig } = config;

	if (cluster.isPrimary) {
		console.log('Master process is running 🚀');

		for (let i = 0; i < workerCount; i++) {
			cluster.fork({ config: JSON.stringify(serverConfig) });
			console.log(`Master Process: Forked worker ${i}`);
		}

		const server = http.createServer(function (req, res) {
			res.writeHead(200);
			res.end('hello world\n');
		});
	}

	if (cluster.isWorker) {
		console.log(`Worker process ${process.pid} is running 🚀`);
		const workerConfig = await rootConfigSchema.parseAsync(
			JSON.parse(process.env.config as string),
		);
		console.log(workerConfig);
	}
}

async function main() {
	program.option('--config <path>', 'Path to the config file');
	program.parse();

	const options = program.opts();
	if (options && 'config' in options) {
		const parsedConfig = await validatedConfig(
			await parseYAMLConfig(options.config),
		);

		createServer({
			port: parsedConfig.server.listen,
			workerCount: parsedConfig.server.workers ?? os.cpus().length,
			config: parsedConfig,
		});
	}
}

main();
