import {
  Policy,
  Role,
  ServicePrincipal,
  PolicyStatement,
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IamResources {
  private construct: Construct;

  constructor(construct: Construct) {
    this.construct = construct;
  }

  public createResources() {
    const lambdaRole = new Role(this.construct, 'Lambda Function IAM Role', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    this.addEC2Policy(lambdaRole);
    return lambdaRole;
  }

  protected addEC2Policy(role: Role) {
    const ec2Policy = new Policy(
      this.construct,
      'EC2 Describe and stop policy',
      {
        statements: [
          new PolicyStatement({
            actions: ['ec2:DescribeInstances', 'ec2:StopInstances'],
            resources: ['*'],
          }),
        ],
        roles: [role],
      }
    );
  }
}
