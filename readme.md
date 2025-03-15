# Node.js Reverse Proxy Prototype

![Demo](assets/video.gif)

This project is a Node.js reverse proxy server that forwards HTTP requests to upstream servers based on configurable rules. It supports multiple workers for handling concurrent requests and can follow redirects.

This project's system design is inspired from NGINX's design.

## Features

- Reverse proxy HTTP requests to upstream servers
- Configurable routing rules
- Supports multiple workers for concurrency
- Handles redirects automatically
- Properly processes and forwards response data and headers

## Prerequisites

- Node.js (v20 or higher)
- pnpm

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yogeshbhutkar/node-reverse-proxy.git
cd node-reverse-proxy
```

2. Install dependencies:

```bash
pnpm install
```

## Configuration

The proxy server is configured using a config.yaml file. Here is an example configuration:

```yaml
server:
  listen: 8080
  workers: 4

  upstreams:
    - id: node1
      url: jsonplaceholder.typicode.com

  rules:
    - path: /
      upstreams:
        - node1
```

## Usage

1. Start the proxy server:

```bash
pnpm run dev
```

2. The server will start listening on the configured port (e.g., `http://localhost:8080`).

## Example

To test the proxy server, you can use `curl` or any HTTP client:

```bash
curl http://localhost:8080/posts
```

Note: This is just a prototype inspired from NGINX server and is not meant for production use.
