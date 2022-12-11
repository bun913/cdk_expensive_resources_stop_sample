import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import {
  AuroraMysqlEngineVersion,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
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
      deletionProtection: false,
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
        InstanceClass.BURSTABLE4_GRAVITON,
        InstanceSize.MICRO
      ),
    });
    return rdsInstance;
  }

  createDBCluster(): DatabaseCluster {
    const cluster = new DatabaseCluster(this.construct, 'Database', {
      deletionProtection: false,
      engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_2_10_3,
      }),
      instanceProps: {
        instanceType: InstanceType.of(
          InstanceClass.BURSTABLE3,
          InstanceSize.SMALL
        ),
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        vpc: this.vpc,
      },
    });
    return cluster;
  }
}
