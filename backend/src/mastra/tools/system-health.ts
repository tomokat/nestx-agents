import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { AppService } from '../../app.service';

export const createSystemHealthTool = (appService: AppService) => {
    return createTool({
        id: 'system-health',
        description: 'Get current system health metrics (CPU, Memory)',
        inputSchema: z.object({}),
        outputSchema: z.object({
            resources: z.object({
                cpu: z.object({
                    usagePercentage: z.string()
                }),
                memory: z.object({
                    usagePercentage: z.string(),
                    free: z.string(),
                    total: z.string()
                })
            })
        }),
        execute: async ({ context }: any) => {
            const logger = context?.mastra?.getLogger();
            logger?.info('System Health Tool Execution Started');

            const health = await appService.getSystemHealth();

            logger?.info('System Health Tool Execution Completed', { health });

            return health;
        }
    });
};
