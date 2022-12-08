import * as path from 'path';
import { Role } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Architecture, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Duration } from 'aws-cdk-lib';

export interface LambdaParam {
  role: Role;
}

export class LambdaResources {
  private scope: Construct;
  private param: LambdaParam;
  private funcDir: string;

  constructor(scope: Construct, param: LambdaParam) {
    this.scope = scope;
    this.param = param;
    this.funcDir = path.join(process.cwd(), 'functions');
  }

  public createResources() {
    new NodejsFunction(
      this.scope,
      'AWS SDK for JavaScript v3 Lambda Function',
      {
        entry: path.join(this.funcDir, 'handlers', 'index.ts'),
        runtime: Runtime.NODEJS_18_X,
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['@aws-sdk/*'],
          tsconfig: path.join(this.funcDir, 'tsconfig.json'),
          format: OutputFormat.ESM,
        },
        architecture: Architecture.ARM_64,
        role: this.param.role,
        logRetention: RetentionDays.TWO_WEEKS,
        tracing: Tracing.ACTIVE,
        timeout: Duration.seconds(10),
      }
    );
  }
}
