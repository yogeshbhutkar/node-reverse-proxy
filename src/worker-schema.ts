import { z } from 'zod';

export const workerRootSchema = z.object({
	url: z.string(),
	headers: z.any(),
	body: z.any(),
	requestType: z.enum(['HTTP']),
});

export type WorkerMessageType = z.infer<typeof workerRootSchema>;
