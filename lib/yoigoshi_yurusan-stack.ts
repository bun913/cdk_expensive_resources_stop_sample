import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EC2Resource } from './resources/ec2';
import { IamResources } from './resources/iam';
import { LambdaResources } from './resources/lambda';

export class YoigoshiYurusanStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const iamResources = new IamResources(this);
    const lambdaRole = iamResources.createResources();
    const lambdaResources = new LambdaResources(this, {
      role: lambdaRole,
    });
    lambdaResources.createResources();
    const sampleEC2 = new EC2Resource(this);
    sampleEC2.createEC2();
  }
}
