import { Controller, Post, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Mastra } from '@mastra/core';

@Controller('agent')
export class AgentController {
    constructor(@Inject('MASTRA') private readonly mastra: Mastra) { }

    @Post('analyze')
    async analyze(@Res() res: Response) {
        try {
            const agent = this.mastra.getAgent('systemAnalyst');
            const result = await agent.generate('Analyze the current system health and provide a status report.');

            // agent.generate() typically returns the result from the underlying model
            // We'll try to access .text if available, or stringify the result
            const analysisText = result.text || JSON.stringify(result, null, 2);

            return res.render('agent-analysis', {
                layout: false,
                analysis: analysisText
            });
        } catch (error) {
            console.error('Agent analysis failed:', error);
            return res.status(200).render('agent-analysis', {
                layout: false,
                analysis: '<div class="alert alert-error">Failed to generate analysis. See logs for details.</div>'
            });
        }
    }
}
