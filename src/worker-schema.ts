import { z } from 'zod';

export const workerRootSchema = z.object({
	url: z.string(),
	headers: z.any(),
	body: z.any(),
	requestType: z.enum(['HTTP']),
});

export const workerResponseSchema = z.object({
	data: z.string().optional(),
	error: z.string().optional(),
	statusCode: z.number().optional(),
});

export type WorkerMessageType = z.infer<typeof workerRootSchema>;
export type WorkerResponseMessageType = z.infer<typeof workerResponseSchema>;
