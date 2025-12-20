import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { Mastra } from '@mastra/core';
import { AppService } from '../app.service';
import { createSystemHealthTool } from '../mastra/tools/system-health';
import { createSystemAnalystAgent } from '../mastra/agents/system-analyst';
import { AppModule } from '../app.module';

@Module({
    imports: [],
    controllers: [AgentController],
    providers: [
        {
            provide: 'MASTRA',
            useFactory: (appService: AppService) => {
                const systemHealthTool = createSystemHealthTool(appService);
                const systemAnalystAgent = createSystemAnalystAgent(systemHealthTool);

                return new Mastra({
                    agents: {
                        systemAnalyst: systemAnalystAgent,
                    },
                });
            },
            inject: [AppService],
        },
        AppService,
    ],
})
export class AgentModule { }
