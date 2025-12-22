import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

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

    const analysisStep: StepDef = {
        id: 'analysisStep',
        inputSchema: z.object({
            context: z.any().optional(),
        }),
        outputSchema: z.object({
            text: z.string().optional()
        }).optional(),
        execute: async ({ context }: any) => {
            const healthData = context?.steps?.fetchStep?.output;
            const result = await systemAnalystAgent.generate(
                `Analyze the following system health data and provide a status report: ${JSON.stringify(healthData)}`
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

    workflow
        .then(fetchStep)
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
