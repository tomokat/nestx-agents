import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { mastra } from '../mastra/mastra';

@Module({
    controllers: [AgentController],
    providers: [
        {
            provide: 'MASTRA',
            useValue: mastra,
        },
    ],
})
export class AgentModule { }
