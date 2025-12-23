import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { Mastra } from '@mastra/core';
import { AppService } from '../app.service';
import { createSystemHealthTool } from '../mastra/tools/system-health';
import { createSystemAnalystAgent } from '../mastra/agents/system-analyst';
import { createSystemWatchdogWorkflow } from '../mastra/workflows/system-watchdog';
import { AppModule } from '../app.module';

import { mastra } from '../mastra/index';

@Module({
    imports: [],
    controllers: [AgentController],
    providers: [
        {
            provide: 'MASTRA',
            useValue: mastra,
        },
        AppService,
    ],
    exports: ['MASTRA'],
})
export class AgentModule { }
