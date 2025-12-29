import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { google } from '@ai-sdk/google';

const execAsync = promisify(exec);

// Helper type to assert Step interface compliance
type StepDef = Step<any, any, any, any, any, any, any>;

export const createSystemWatchdogWorkflow = (systemHealthTool: any, systemAnalystAgent: any) => {
    const fetchStep: StepDef = {
        id: 'fetchStep',
        inputSchema: z.object({}).optional(),
        outputSchema: z.object({
            status: z.string(),
            resources: z.object({
                memory: z.object({
                    usagePercentage: z.string(),
                }).optional(),
            }).optional(),
        }).optional(),
        execute: async ({ context, mastra }: any) => {
            return await systemHealthTool.execute({});
        },
    };

    const networkStep: StepDef = {
        id: 'networkStep',
        inputSchema: z.object({}).optional(),
        outputSchema: z.object({
            latency: z.union([z.number(), z.string()])
                .transform((val) => {
                    const strVal = String(val);
                    const clean = strVal.replace(/[^0-9.]/g, '');
                    return clean ? parseFloat(clean) : 0;
                })
                .pipe(z.number())
                .optional(),
            status: z.string()
        }),
        execute: async ({ context, mastra }: any) => {
            try {
                // Ping google.com once, timeout after 2 seconds
                const { stdout } = await execAsync('ping -c 1 -W 2000 google.com');
                const match = stdout.match(/time=([\d.]+)/);
                const latency = match ? parseFloat(match[1]) : 0;
                return { latency, status: 'online' };
            } catch (error) {
                return { latency: -1, status: 'offline' };
            }
        },
    };

    const processStep: StepDef = {
        id: 'processStep',
        inputSchema: z.object({}).optional(),
        outputSchema: z.object({
            processes: z.array(z.object({
                pid: z.string(),
                memory: z.string(),
                command: z.string().transform(val => val.toLowerCase())
            }))
        }),
        execute: async ({ context, mastra }: any) => {
            try {
                const { stdout } = await execAsync('ps -A -o pid,pmem,comm | sort -nrk 2 | head -n 3');
                const lines = stdout.trim().split('\n');
                const processes = lines.map(line => {
                    const parts = line.trim().split(/\s+/);
                    return {
                        pid: parts[0],
                        memory: parts[1],
                        command: parts.slice(2).join(' ')
                    };
                });
                return { processes };
            } catch (error) {
                return { processes: [] };
            }
        },
    };

    const analysisStep: StepDef = {
        id: 'analysisStep',
        inputSchema: z.object({
            context: z.any().optional(),
        }),
        outputSchema: z.object({
            text: z.string().optional()
        }).optional(),
        execute: async (args: any) => {
            const { suspend, runId, mastra, tracingContext, getStepResult, resumeData, resume } = args;
            const isResuming = !!(args as any).resume;

            const initData = typeof (args as any).getInitData === 'function' ? await (args as any).getInitData() : {};

            // Comprehensive check for the force flag across all possible Beta API locations
            const skipSuspend = isResuming ||
                resumeData?.force ||
                resume?.resumePayload?.force ||
                (args as any)?.data?.force ||
                (args as any)?.inputData?.force ||
                (args as any)?.input?.force ||
                (args as any)?.context?.input?.force ||
                (args as any)?.context?.triggerData?.force ||
                initData?.force;

            console.log('🔍 analysisStep: isResuming=', isResuming, 'skipSuspend=', skipSuspend);
            console.log('🔍 analysisStep: available arg keys:', Object.keys(args));
            if (initData) console.log('🔍 analysisStep: initData:', JSON.stringify(initData));

            if (skipSuspend) console.log('🔄 Bypassing suspension due to force flag');

            const fetchResult = getStepResult('fetchStep');
            const networkResult = getStepResult('networkStep');
            const processResult = getStepResult('processStep');

            const combinedData = {
                system: fetchResult,
                network: networkResult,
                topProcesses: processResult
            };

            const memoryUsage = parseFloat(fetchResult?.resources?.memory?.usagePercentage || '0');

            if (memoryUsage > 90 && !skipSuspend) {
                if (suspend) {
                    await suspend({ force: true });
                }
            }

            const systemAnalyst = mastra.getAgent('systemAnalyst');
            const result = await systemAnalyst.generate(
                `Analyze the following system health data and provide a status report.Look for correlations between high cpu / memory and specific processes, and check if network latency is affected.Data: ${JSON.stringify(combinedData)} `,
                { runId, tracingContext }
            );

            return { text: result.text };
        },
    };

    const logCritical: StepDef = {
        id: 'logCritical',
        inputSchema: z.object({}),
        outputSchema: z.object({
            status: z.string()
        }),
        execute: async ({ mastra }: any) => {
            const logger = mastra?.getLogger();
            logger?.warn('CRITICAL: High memory usage detected!');
            return { status: 'CRITICAL' };
        },
    };

    const logNormal: StepDef = {
        id: 'logNormal',
        inputSchema: z.object({}),
        outputSchema: z.object({
            status: z.string()
        }),
        execute: async ({ mastra }: any) => {
            const logger = mastra?.getLogger();
            logger?.info('System operating normally.');
            return { status: 'NORMAL' };
        },
    };

    const saveToMemory: StepDef = {
        id: 'saveToMemory',
        inputSchema: z.any().optional(),
        outputSchema: z.object({
            success: z.boolean()
        }),
        execute: async ({ context, mastra, getStepResult }: any) => {
            const analysisStepResult = getStepResult('analysisStep');
            console.log('💾 RAG: analysisStepResult keys:', Object.keys(analysisStepResult || {}));
            const analysisResult = analysisStepResult?.text || analysisStepResult?.output?.text || analysisStepResult;
            console.log('💾 RAG: Attempting to save to memory. Analysis length:', typeof analysisResult === 'string' ? analysisResult.length : (analysisResult ? 'exists' : 'null'));
            const fetchResult = getStepResult('fetchStep');
            const networkResult = getStepResult('networkStep');
            const processResult = getStepResult('processStep');

            const combinedData = {
                system: fetchResult,
                network: networkResult,
                topProcesses: processResult,
                analysis: analysisResult
            };

            const vectorStore = mastra.getVector('system_memory');

            if (vectorStore) {
                try {
                    const { embed } = require('ai');
                    const model = google.embedding('text-embedding-004');

                    const valueToEmbed = typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult);

                    const { embedding } = await embed({
                        model,
                        value: valueToEmbed,
                    });

                    await vectorStore.upsert({
                        indexName: 'system_memory',
                        vectors: [embedding],
                        metadata: [combinedData],
                        ids: [`analysis-${Date.now()}`]
                    });
                    console.log('✅ RAG: Successfully saved analysis to vector store');
                    return { success: true };
                } catch (err: any) {
                    console.error('❌ RAG: Failed to save to memory:', err.message);
                    console.error(err.stack);
                    return { success: false, error: err.message };
                }
            } else {
                console.error('❌ RAG: Vector store system_memory not found');
            }
            return { success: false };
        }
    };

    // Cast workflow to 'any' to bypass TS validation for .then/.branch if strict types are missing
    const workflow = new Workflow({
        id: 'system-watchdog',
        name: 'system-watchdog',
        triggerSchema: z.object({}),
    } as any) as any;

    workflow
        .parallel([fetchStep, networkStep, processStep])
        .then(analysisStep)
        .then(saveToMemory)
        .branch([
            [
                ({ context }: any) => {
                    const analysisResult = context?.steps?.analysisStep?.output?.text || '';
                    return analysisResult.toLowerCase().includes('critical') ||
                        analysisResult.toLowerCase().includes('alert');
                },
                logCritical
            ],
            [
                ({ context }: any) => {
                    const analysisResult = context?.steps?.analysisStep?.output?.text || '';
                    return !(analysisResult.toLowerCase().includes('critical') ||
                        analysisResult.toLowerCase().includes('alert'));
                },
                logNormal
            ]
        ]);

    return workflow.commit();
};
