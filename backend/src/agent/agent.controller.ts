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
            const result = await run.resume({ stepId: 'analysisStep' });

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
            const run = await workflow.createRun();
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
                            // Wait for the final result from the stream promise
                            // @ts-ignore
                            const finalResult = await stream.result;
                            const results = finalResult.results || {};

                            // Reconstruct combinedData
                            // We need outputs from: fetchStep, networkStep, processStep
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
                                    const scoreResult = await scorer.run({
                                        input: combinedData,
                                        output: analysisResult
                                    });
                                    console.log('SCORER RESULT:', scoreResult.score);
                                    console.log('SCORER INFO:', (scoreResult as any).info);

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
                                    } else {
                                        console.warn('Scores storage not found.');
                                    }
                                } else {
                                    console.error('Scorer systemReportScorer not found');
                                }
                            } else {
                                console.warn('Analysis result not found for scoring');
                                console.log('DEBUG - Step Keys:', Object.keys(finalResult.results || {}));
                                console.log('DEBUG - Analysis Step Object:', JSON.stringify(results['analysisStep'] || {}, null, 2));
                            }

                        } catch (scoreErr) {
                            console.error('Error running scorer:', scoreErr);
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
}
