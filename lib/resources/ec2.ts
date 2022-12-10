import {
  AmazonLinuxCpuType,
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class EC2Resource {
  readonly construct: Construct;
  readonly vpc: Vpc;

  constructor(construct: Construct, vpc: Vpc) {
    this.construct = construct;
    this.vpc = vpc;
  }

  public createEC2() {
    const ami = new AmazonLinuxImage({
      generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: AmazonLinuxCpuType.X86_64,
    });
    ['sample1', 'sample2'].forEach((id) => {
      new Instance(this.construct, id, {
        vpc: this.vpc,
        instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
        machineImage: ami,
      });
    });
  }
}
