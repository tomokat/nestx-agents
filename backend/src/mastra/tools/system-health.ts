import { createTool } from '@mastra/core';
import { z } from 'zod';
import { AppService } from '../../app.service';

export const createSystemHealthTool = (appService: AppService) => createTool({
    id: 'system-health',
    description: 'Checks the real-time health of the system including memory usage, uptime, and load average.',
    inputSchema: z.object({}),
    execute: async () => {
        return appService.getRealSystemHealth();
    },
});
