import { Mastra } from '@mastra/core';
import { Observability } from '@mastra/observability';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { AppService } from '../app.service';
import { createSystemHealthTool } from './tools/system-health';
import { createSystemAnalystAgent } from './agents/system-analyst';
import { systemReportScorer } from './scorers';
import { createSystemWatchdogWorkflow } from './workflows/system-watchdog';

// Initialize Vector Store
const vectorStore = new LibSQLVector({
    connectionUrl: 'file:mastra.db',
    id: 'system_memory_vector',
});

// Manual instantiation for CLI context (outside NestJS IOC)
const appService = new AppService();
const systemHealthTool = createSystemHealthTool(appService);
const systemAnalystAgent = createSystemAnalystAgent(systemHealthTool, vectorStore);
const systemWatchdogWorkflow = createSystemWatchdogWorkflow(systemHealthTool, systemAnalystAgent);

// Create Index (Idempotent-ish check usually good, but we'll just call it)
// In a real app, maybe check if exists or catch error.
// For this script, we'll await it in the init block or just fire and forget if safe.
// Per instructions, we call it. Since top-level await might be tricky if not in module,
// we'll put it in the async init block at the bottom


const libSqlStore = new LibSQLStore({
    url: 'file:mastra.db',
    id: 'default_store'
});

export const mastra = new Mastra({
    agents: {
        systemWatchdog: systemAnalystAgent,
    },
    workflows: {
        systemWatchdog: systemWatchdogWorkflow,
    },
    vectors: {
        system_memory: vectorStore,
    },
    storage: libSqlStore,
    scorers: {
        systemReportScorer: systemReportScorer as any,
    },
    observability: new Observability({
        default: {
            enabled: true
        },
    }),
});

(async () => {
    console.log('Mastra Storage Initializing...');
    await mastra?.getStorage()?.init();

    // Create Vector Index
    await vectorStore.createIndex({ indexName: 'system_memory', dimension: 768 });

    const workflow = mastra.getWorkflow('systemWatchdog');
    if (workflow) {
        const run = await workflow.createRun({
            threadId: 'system-monitor-thread',
            resourceId: 'system-monitor'
        });
        console.log('Workflow run created:', run?.runId);
    }
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
        agentObs: !!mastra.getAgent('systemWatchdog').observability
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
    agentFound: !!mastra.getAgent('systemWatchdog')
});

// FORCE SYNC: Tell the engine to re-scan and instrument all registered agents
// @ts-ignore
mastra.instrumentAgents?.();