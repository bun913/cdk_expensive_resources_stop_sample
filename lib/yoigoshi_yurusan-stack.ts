import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EC2Resource } from './resources/ec2';
import { NetworkResource } from './resources/network';
import { RDSResource } from './resources/rds';

export class YoigoshiYurusanStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const network = new NetworkResource(this);
    const vpc = network.createVpc();
    const sampleEC2 = new EC2Resource(this, vpc);
    sampleEC2.createEC2();
    const db = new RDSResource(this, vpc);
    const rdsInstance = db.createDBInstance();
  }
}
