import { program } from 'commander';
import { parseYAMLConfig, validatedConfig } from './config';
import os from 'node:os';
import { createServer } from './server';

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
