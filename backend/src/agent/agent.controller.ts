import { Controller, Post, Sse, Inject, Res, Param, Body } from '@nestjs/common';
import type { Response } from 'express';
import { Mastra } from '@mastra/core';
import { Observable } from 'rxjs';

@Controller('agent')
export class AgentController {
    constructor(@Inject('MASTRA') private readonly mastra: Mastra) { }

    @Post('analyze')
    async analyze(@Res() res: Response) {
        // Return the partial that connects to the SSE stream
        return res.render('agent-analysis', {
            layout: false,
            analysis: '', // Start empty, will be filled by stream
        });
    }

    @Post('resume/:runId')
    async resume(@Param('runId') runId: string) {
        const workflow = this.mastra.getWorkflow('systemWatchdog') as any;
        if (!workflow) {
            throw new Error('Workflow systemWatchdog not found');
        }

        try {
            // Rehydrate the run using createRun
            // This works because we now have persistent LibSQL storage
            const run = await (workflow as any).createRun({ runId });

            if (!run) {
                throw new Error('Failed to create run instance from workflow');
            }

            console.log('Resuming run:', runId);
            // Use resume and pass force: true in resumeData to skip the memory check re-run
            const result = await (run as any).resume({
                stepId: 'analysisStep',
                resumeData: { force: true },
                isVNext: true // Corrects double-closure bug in Beta
            });

            console.log('Resume call completed. Result status:', result?.status);

            // If the workflow is finished (success or failure), we return the final result
            // This prevents the "Controller is already closed" error by finishing the request cleanly
            if (result?.status === 'success' || result?.status === 'failed') {
                // RUN SCORING ON RESUME COMPLETION
                await this.processScoring(run, result);
                return { status: 'completed', runId, result };
            }

            if (result?.status === 'suspended') {
                console.log('WARNING: Workflow RE-SUSPENDED at step:', Object.keys(result?.steps || {}).pop());
            }

            return { status: 'resumed', runId, result };
        } catch (error) {
            console.error('RESUME ERROR DETAILED:', error);
            throw error;
        }
    }

    @Sse('stream-analysis')
    async streamAnalysis(): Promise<Observable<MessageEvent>> {
        console.log('Stream Analysis Initiated');
        try {
            const workflow = this.mastra.getWorkflow('systemWatchdog') as any;
            if (!workflow) {
                console.error('Workflow not found');
                throw new Error('Workflow systemWatchdog not found');
            }

            console.log('Creating workflow run...');
            // Using createRun to ensure we have a valid run context
            const run = await workflow.createRun({
                threadId: 'system-monitor-thread',
                resourceId: 'system-monitor'
            });
            console.log('Workflow run created:', run?.runId);

            // Use standard run stream (vNext pattern)
            console.log('Starting stream...');
            const stream = await run.stream();
            console.log('Stream started');

            return new Observable<MessageEvent>(subscriber => {
                (async () => {
                    try {
                        for await (const chunk of stream) {
                            // console.log('Chunk received', chunk);
                            subscriber.next({ data: chunk } as MessageEvent);
                        }
                        console.log('Stream complete');
                        subscriber.complete();

                        try {
                            // @ts-ignore
                            const finalResult = await stream.result;
                            await this.processScoring(run, finalResult);
                        } catch (scoreErr) {
                            console.error('Error in scoring loop:', scoreErr);
                        }
                    } catch (err) {
                        console.error('Stream subscription error:', err);
                        subscriber.error(err);
                    }
                })();
            });
        } catch (err) {
            console.error('Setup Analysis Error:', err);
            throw err;
        }
    }

    private async processScoring(run: any, finalResult: any) {
        const results = finalResult.results || finalResult.steps || {};

        // Reconstruct combinedData
        const fetchStep = results['fetchStep'];
        const networkStep = results['networkStep'];
        const processStep = results['processStep'];

        const fetchResult = fetchStep?.output || fetchStep?.result || fetchStep;
        const networkResult = networkStep?.output || networkStep?.result || networkStep;
        const processResult = processStep?.output || processStep?.result || processStep;

        const combinedData = {
            system: fetchResult,
            network: networkResult,
            topProcesses: processResult
        };

        // Get analysisResult
        const analysisStep = results['analysisStep'];
        const analysisResult = analysisStep?.output?.text || analysisStep?.result?.text || analysisStep?.text || analysisStep?.output;

        if (analysisResult) {
            console.log('Executing Scorer...');
            // @ts-ignore
            const scorer = this.mastra.getScorer('systemReportScorer');
            if (scorer) {
                try {
                    const scoreResult = await scorer.run({
                        input: combinedData,
                        output: analysisResult
                    });
                    console.log('SCORER RESULT:', scoreResult.score);

                    // Persist to DB
                    const scoresStorage = this.mastra.getStorage()?.stores?.scores;
                    if (scoresStorage) {
                        console.log('Persisting score to DB...');
                        await scoresStorage.saveScore({
                            score: scoreResult.score as number,
                            reason: (scoreResult as any).info?.reason,
                            scorerId: scorer.id,
                            runId: run.runId,
                            entityId: run.runId,
                            source: 'LIVE',
                            scorer: { id: scorer.id },
                            entity: { id: run.runId, type: 'workflow_run' },
                            input: combinedData,
                            output: analysisResult,
                        });
                        console.log('Score persisted.');
                    }
                } catch (scoreErr) {
                    console.error('Error running scorer:', scoreErr);
                }
            }
        } else {
            console.warn('Analysis result not found for scoring. Step Keys:', Object.keys(results));
        }
    }
}
