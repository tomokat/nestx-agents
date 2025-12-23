import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper type to assert Step interface compliance
type StepDef = Step<any, any, any, any, any, any, any>;

export const createSystemWatchdogWorkflow = (systemHealthTool: any, systemAnalystAgent: any) => {
    const fetchStep: StepDef = {
        id: 'fetchStep',
        inputSchema: z.object({}),
        outputSchema: z.object({
            status: z.string(),
            resources: z.object({
                memory: z.object({
                    usagePercentage: z.string(),
                }).optional(),
            }).optional(),
        }).optional(),
        execute: async () => {
            return await systemHealthTool.execute({});
        },
    };

    const networkStep: StepDef = {
        id: 'networkStep',
        inputSchema: z.object({}),
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
        execute: async () => {
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
        inputSchema: z.object({}),
        outputSchema: z.object({
            processes: z.array(z.object({
                pid: z.string(),
                memory: z.string(),
                command: z.string().transform(val => val.toLowerCase())
            }))
        }),
        execute: async () => {
            try {
                // Get top 3 processes by memory usage
                // ps -eo pid,pmem,comm | sort -k 2 -r | head -n 4 (1 header + 3 rows)
                // On mac: ps -A -o pid,pmem,comm (flags might vary, using standard -o)
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
        execute: async ({ context, suspend }: any) => {
            const fetchResult = context?.steps?.fetchStep?.output;
            const networkResult = context?.steps?.networkStep?.output;
            const processResult = context?.steps?.processStep?.output;

            // Explicitly fetch system health to ensure we have fresh data for the check
            const freshHealth = await systemHealthTool.execute({});
            const memoryUsage = parseFloat(freshHealth?.resources?.memory?.usagePercentage || '0');

            if (memoryUsage > 90) { // Threshold for critical suspension
                if (suspend) {
                    await suspend();
                    // Execution continues here after resume
                }
            }

            const combinedData = {
                system: fetchResult,
                network: networkResult,
                topProcesses: processResult
            };

            const result = await systemAnalystAgent.generate(
                `Analyze the following system health data and provide a status report. Look for correlations between high cpu/memory and specific processes, and check if network latency is affected. Data: ${JSON.stringify(combinedData)}`
            );
            return result.text;
        },
    };

    const logCritical: StepDef = {
        id: 'logCritical',
        inputSchema: z.object({}),
        outputSchema: z.object({
            status: z.string()
        }),
        execute: async () => {
            console.log('CRITICAL: High memory usage detected!');
            return { status: 'CRITICAL' };
        },
    };

    const logNormal: StepDef = {
        id: 'logNormal',
        inputSchema: z.object({}),
        outputSchema: z.object({
            status: z.string()
        }),
        execute: async () => {
            console.log('System operating normally.');
            return { status: 'NORMAL' };
        },
    };

    // Cast workflow to 'any' to bypass TS validation for .then/.branch if strict types are missing
    const workflow = new Workflow({
        id: 'system-watchdog',
        name: 'system-watchdog',
        triggerSchema: z.object({}),
    } as any) as any;

    // Use .parallel() as requested to run the initial data gathering steps simultaneously
    // Then pipe into analysis
    workflow
        .parallel([fetchStep, networkStep, processStep])
        .then(analysisStep)
        .branch([
            [
                (context: any) => {
                    const usageStr = context?.steps?.fetchStep?.output?.resources?.memory?.usagePercentage || "0";
                    const usage = parseFloat(usageStr);
                    return Promise.resolve(usage > 90);
                },
                logCritical
            ],
            [
                (context: any) => {
                    const usageStr = context?.steps?.fetchStep?.output?.resources?.memory?.usagePercentage || "0";
                    const usage = parseFloat(usageStr);
                    return Promise.resolve(usage <= 90);
                },
                logNormal
            ]
        ]);

    return workflow.commit();
};
