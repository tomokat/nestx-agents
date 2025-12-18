import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { TasksController } from './tasks/tasks.controller';

@Module({
  imports: [],
  controllers: [AppController, DashboardController, TasksController],
  providers: [AppService],
})
export class AppModule { }
