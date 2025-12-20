import { createTool } from '@mastra/core';
import { z } from 'zod';

export const systemHealthTool = createTool({
    id: 'system-health',
    description: 'Checks the health of the system components including database, cache, and external APIs.',
    inputSchema: z.object({}),
    execute: async () => {
        // Mock health check logic - in a real app, this would check actual services
        const healthData = {
            status: 'operational',
            timestamp: new Date().toISOString(),
            components: {
                database: { status: 'up', latency: '12ms' },
                cache: { status: 'up', latency: '2ms' },
                apiGateway: { status: 'up', latency: '45ms' },
            },
            activeUserCount: Math.floor(Math.random() * 100) + 50,
            systemLoad: {
                cpu: '12%',
                memory: '34%',
            },
        };

        return healthData;
    },
});
