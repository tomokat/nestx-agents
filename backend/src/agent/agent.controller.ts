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
    streamAnalysis(): Observable<MessageEvent> {
        return new Observable<MessageEvent>(subscriber => {
            const agent = this.mastra.getAgent('systemAnalyst');

            (async () => {
                try {
                    const result = await agent.stream('Analyze the current system health and provide a status report.', { maxSteps: 3 });

                    let fullText = '';

                    // The result from agent.stream() contains a textStream property which is an async iterable
                    if (result && result.textStream) {
                        for await (const chunk of result.textStream) {
                            fullText += chunk;
                            // Format as HTMX OOB swap
                            // We stream plain text chunks wrapped in a div swap for the inner content
                            const swap = `<span hx-swap-oob="beforeend:#analysis-result">${chunk}</span>`;
                            subscriber.next({ data: swap } as MessageEvent);
                        }
                    }

                    // FINAL SWAP: Replace the entire card with a static version to kill the SSE connection
                    const finalCard = `
<div class="agent-analysis-result p-4 bg-base-200 rounded-lg shadow-md animate-fade-in" id="agent-analysis-card">
    <div class="flex items-center gap-2 mb-3">
        <div class="badge badge-primary">AI Analysis (Complete)</div>
        <span class="text-xs text-opacity-50">Gemini 2.5 Flash</span>
    </div>
    <div class="prose prose-sm max-w-none" id="analysis-result">${fullText}</div>
    <div class="divider my-2"></div>
    <div class="text-xs text-base-content/50">Trace ID: ${result.runId || 'N/A'}</div>
</div>`;

                    subscriber.next({
                        data: `<div hx-swap-oob="outerHTML:#agent-analysis-card">${finalCard}</div>`
                    } as MessageEvent);

                    subscriber.complete();
                } catch (error) {
                    console.error('Streaming failed:', error);
                    const errorCard = `
<div class="agent-analysis-result p-4 bg-base-200 rounded-lg shadow-md animate-fade-in" id="agent-analysis-card">
    <div class="flex items-center gap-2 mb-3">
        <div class="badge badge-error">Analysis Failed</div>
    </div>
    <div class="prose prose-sm max-w-none text-error">
        Error: ${error.message || 'Unknown error occurred'}
    </div>
</div>`;
                    subscriber.next({
                        data: `<div hx-swap-oob="outerHTML:#agent-analysis-card">${errorCard}</div>`
                    } as MessageEvent);
                    subscriber.complete();
                }
            })();
        });
    }
}
