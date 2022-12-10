import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion,
  StorageType,
} from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export class RDSResource {
  readonly construct: Construct;
  readonly vpc: Vpc;

  constructor(construct: Construct, vpc: Vpc) {
    this.construct = construct;
    this.vpc = vpc;
  }

  createDBInstance(): DatabaseInstance {
    const rdsInstance = new DatabaseInstance(this.construct, 'Gp3Instance', {
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_30,
      }),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      allocatedStorage: 500,
      storageType: StorageType.STANDARD,
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE3,
        InstanceSize.NANO
      ),
    });
    return rdsInstance;
  }
}
