import {
  AmazonLinuxCpuType,
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class EC2Resource {
  readonly construct: Construct;

  constructor(construct: Construct) {
    this.construct = construct;
  }

  public createEC2() {
    const vpc = new Vpc(this.construct, 'Vpc', {
      cidr: '10.100.0.0/16',
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
    const ami = new AmazonLinuxImage({
      generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: AmazonLinuxCpuType.X86_64,
    });
    const ec2 = new Instance(this.construct, 'sampleInstance', {
      vpc: vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: ami,
    });
  }
}
