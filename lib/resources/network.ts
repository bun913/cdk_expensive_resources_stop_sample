import { SubnetType, Vpc, IpAddresses } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkResource {
  readonly construct: Construct;

  constructor(construct: Construct) {
    this.construct = construct;
  }

  public createVpc(): Vpc {
    const vpc = new Vpc(this.construct, 'Vpc', {
      ipAddresses: IpAddresses.cidr('10.100.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
    return vpc;
  }
}
