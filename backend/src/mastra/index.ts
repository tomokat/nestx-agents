
import { Mastra } from '@mastra/core';
import { AppService } from '../app.service';
import { createSystemHealthTool } from './tools/system-health';
import { createSystemAnalystAgent } from './agents/system-analyst';
import { createSystemWatchdogWorkflow } from './workflows/system-watchdog';

// Manual instantiation for CLI context (outside NestJS IOC)
const appService = new AppService();
const systemHealthTool = createSystemHealthTool(appService);
const systemAnalystAgent = createSystemAnalystAgent(systemHealthTool);
const systemWatchdogWorkflow = createSystemWatchdogWorkflow(systemHealthTool, systemAnalystAgent);

export const mastra = new Mastra({
    agents: {
        systemAnalyst: systemAnalystAgent,
    },
    workflows: {
        systemWatchdog: systemWatchdogWorkflow,
    },
});
