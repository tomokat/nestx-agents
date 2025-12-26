import { Mastra } from '@mastra/core';
import { Observability } from '@mastra/observability';
import { LibSQLStore } from '@mastra/libsql';
import { AppService } from '../app.service';
import { createSystemHealthTool } from './tools/system-health';
import { createSystemAnalystAgent } from './agents/system-analyst';
import { createSystemWatchdogWorkflow } from './workflows/system-watchdog';

// Manual instantiation for CLI context (outside NestJS IOC)
const appService = new AppService();
const systemHealthTool = createSystemHealthTool(appService);
const systemAnalystAgent = createSystemAnalystAgent(systemHealthTool);
const systemWatchdogWorkflow = createSystemWatchdogWorkflow(systemHealthTool, systemAnalystAgent);

const libSqlStore = new LibSQLStore({
    url: 'file:mastra.db',
    id: 'default_store'
});

export const mastra = new Mastra({
    agents: {
        systemAnalyst: systemAnalystAgent,
    },
    workflows: {
        systemWatchdog: systemWatchdogWorkflow,
    },
    storage: libSqlStore,
    observability: new Observability({
        default: {
            enabled: true
        },
    }),
});

(async () => {
    console.log('Mastra Storage Initializing...');
    await mastra?.getStorage()?.init();
})();

// Add this to mastra/index.ts
libSqlStore.init().then(() => {
    const logger = mastra.getLogger();
    logger.info('✅ Mastra Storage Initialized successfully');

    // Debug Observability
    // @ts-ignore
    // const obs = mastra.observability;
    // logger.info('Observability Status', {
    //     enabled: !!obs,
    //     provider: 'default',
    //     telemetryDisabled: true // confirmed by config
    // });
    logger.info('REAL Observability Status', {
        hasObsObject: !!mastra.observability,
        // @ts-ignore - Let's check the internal enabled state
        isEnabled: mastra.observability?.config?.enabled,
        // @ts-ignore - Check if the agent is actually linked
        agentObs: !!mastra.getAgent('systemAnalyst').observability
    });
}).catch(err => {
    const logger = mastra.getLogger();
    logger.error('❌ Mastra Storage Failed:', err);
});

// 2. THE FORCE LINK (The "Power-Move")
// After the mastra instance exists, we manually hand the 
// observability provider to the agent.
if (mastra.observability) {
    // In many Beta versions, this is the internal method the engine uses
    // @ts-ignore
    systemAnalystAgent.__setObservability?.(mastra.observability);

    // Fallback: Some beta versions use the .observability property directly
    // @ts-ignore
    systemAnalystAgent.observability = mastra.observability;

    // In some Beta versions, the provider is a separate internal property
    // @ts-ignore
    if (mastra.observability.provider) {
        // @ts-ignore
        systemAnalystAgent.__provider = mastra.observability.provider;
    }
}

// CHECK THE ENGINE, NOT THE AGENT
// @ts-ignore - The telemetry engine itself holds the provider
const telemetryEngine = (mastra as any).telemetry;

console.log('FINAL ENGINE AUDIT:', {
    hasEngine: !!telemetryEngine,
    // This will tell us if the engine has a live connection to the DB
    hasExporter: !!telemetryEngine?.exporter,
});

// FORCE SYNC: Tell the engine to re-scan and instrument all registered agents
// @ts-ignore
mastra.instrumentAgents?.();