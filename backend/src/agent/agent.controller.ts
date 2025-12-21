import { Controller, Post, Sse, Inject, Res } from '@nestjs/common';
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

        // Transform stream to Observable MessageEvents attempting to emit raw JSON
        // We use 'from' to wrap the async iterable stream
        // We do NOT wrap valid JSON in strings or HTML. We send objects.
        // NestJS @Sse will serialize objects to data: JSON_STRING automatically if we return objects.
        // Or we can manually serialize needed properties.

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
