import { Mastra } from '@mastra/core';
import { systemAnalystAgent } from './agents/system-analyst';

export const mastra = new Mastra({
    agents: {
        systemAnalyst: systemAnalystAgent,
    },
});
