import fs from 'node:fs/promises';
import { parse } from 'yaml';

async function parseYAMLConfig(filepath: string) {
	const configFileContent = await fs.readFile(filepath, 'utf8');
	const parsedConfig = parse(configFileContent);
	return JSON.stringify(parsedConfig);
}
