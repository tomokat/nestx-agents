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
            // Rehydrate the run using createRunAsync
            // This works because we now have persistent LibSQL storage
            const run = await (workflow as any).createRunAsync({ runId });

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
        const workflow = this.mastra.getWorkflow('systemWatchdog') as any;
        if (!workflow) {
            throw new Error('Workflow systemWatchdog not found');
        }

        // Using createRunAsync to ensure we have a valid run context
        const run = await workflow.createRunAsync();

        // Use standard run stream (vNext pattern)
        const stream = run.stream ? run.stream() : (await workflow.streamAsync ? await workflow.streamAsync() : workflow.stream());

        return new Observable<MessageEvent>(subscriber => {
            (async () => {
                try {
                    for await (const chunk of stream) {
                        subscriber.next({ data: chunk } as MessageEvent);
                    }
                    subscriber.complete();
                } catch (err) {
                    subscriber.error(err);
                }
            })();
        });
    }
}
