export function parseHostAndPort(url: string): { host: string; port?: number } {
	const [host, port] = url.split(':');
	return {
		host,
		port: port ? parseInt(port, 10) : undefined,
	};
}
