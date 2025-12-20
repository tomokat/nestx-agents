import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import serverlessExpress from 'serverless-http';
import 'hbs'; // Force include for Netlify bundler

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', '..', 'packages', 'ui', 'dist'), {
    prefix: '/static',
  });
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Adapt views directory for serverless environment
  // In Netlify Functions (Lambda), the files are flattened in the function directory
  // We accepted 'backend/dist/views/**' in netlify.toml, so they are adjacent to main.js
  const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  const viewsDir = isServerless
    ? join(__dirname, 'views')
    : join(__dirname, '..', 'views');

  app.setBaseViewsDir(viewsDir);
  app.setViewEngine('hbs');

  // Register partials
  const hbs = require('hbs');

  await new Promise<void>((resolve, reject) => {
    hbs.registerPartials(viewsDir, (err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  return app;
}

// Global handler cache
let serverlessHandler: any;

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error ? exception.message : exception;
    const stack = exception instanceof Error ? exception.stack : null;

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: message,
        stack: stack,
        debugViewsDir: process.env.AWS_LAMBDA_FUNCTION_NAME ? require('path').join(__dirname, 'views') : 'local'
      });
  }
}

export const handler = async (event: any, context: any) => {
  if (!serverlessHandler) {
    const app = await bootstrap();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    serverlessHandler = serverlessExpress(expressApp);
  }
  return serverlessHandler(event, context);
};

// Local development
if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  bootstrap().then(app => {
    app.useGlobalFilters(new AllExceptionsFilter());
    app.listen(3000);
  });
}
