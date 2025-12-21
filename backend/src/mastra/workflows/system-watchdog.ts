import { Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

export const createSystemWatchdogWorkflow = (systemHealthTool: any, systemAnalystAgent: any) => {
    const fetchStep = {
        id: 'fetchStep',
        execute: async () => {
            return await systemHealthTool.execute({});
        },
    };

    const analysisStep = {
        id: 'analysisStep',
        execute: async ({ context }: any) => {
            const healthData = context?.steps?.fetchStep?.output;
            const result = await systemAnalystAgent.generate(
                `Analyze the following system health data and provide a status report: ${JSON.stringify(healthData)}`
            );
            return result.text;
        },
    };

    const logCritical = {
        id: 'logCritical',
        execute: async () => {
            console.log('CRITICAL: High memory usage detected!');
            return { status: 'CRITICAL' };
        },
    };

    const logNormal = {
        id: 'logNormal',
        execute: async () => {
            console.log('System operating normally.');
            return { status: 'NORMAL' };
        },
    };

    const workflow = new Workflow({
        name: 'system-watchdog',
        triggerSchema: z.object({}),
    } as any);

    // Chain steps: fetch -> analysis
    // And add branching logic.
    // We attach the branch *after* the analysis step, but the condition checks the fetch step output.
    // This means the flow is: Fetch -> Analysis -> Branch (routes to Critical or Normal)

    workflow
        .then(fetchStep as any)
        .then(analysisStep as any)
        .branch([
            [
                (context: any) => {
                    const usageStr = context?.steps?.fetchStep?.output?.resources?.memory?.usagePercentage || "0";
                    const usage = parseFloat(usageStr);
                    return Promise.resolve(usage > 90);
                },
                logCritical as any
            ],
            [
                (context: any) => {
                    const usageStr = context?.steps?.fetchStep?.output?.resources?.memory?.usagePercentage || "0";
                    const usage = parseFloat(usageStr);
                    return Promise.resolve(usage <= 90);
                },
                logNormal as any
            ]
        ] as any);

    return workflow.commit();
};
