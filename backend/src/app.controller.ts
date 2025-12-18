import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('debug-env')
  getDebugEnv() {
    const fs = require('fs');
    const path = require('path');

    // Helper to recursively list files (shallow or deep)
    const listFiles = (dir: string, depth = 0) => {
      if (depth > 2) return '...';
      try {
        const files = fs.readdirSync(dir);
        return files.map((f: string) => {
          const stats = fs.statSync(path.join(dir, f));
          return stats.isDirectory() ? { [f]: listFiles(path.join(dir, f), depth + 1) } : f;
        });
      } catch (e) {
        return e.message;
      }
    };

    return {
      cwd: process.cwd(),
      dirname: __dirname,
      filesInCwd: listFiles(process.cwd()),
      filesInDirname: listFiles(__dirname),
      env: {
        NETLIFY: process.env.NETLIFY,
        LAMBDA: process.env.AWS_LAMBDA_FUNCTION_NAME,
      }
    };
  }
}
