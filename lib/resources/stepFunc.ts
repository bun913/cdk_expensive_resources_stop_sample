import * as dotenv from 'dotenv';
dotenv.config();
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { SecretValue } from 'aws-cdk-lib';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

export class StepFunc {
  readonly construct: Construct;
  constructor(construct: Construct) {
    this.construct = construct;
  }

  public createState() {
    // 一番外側の並行処理
    const mainParallel = new sfn.Parallel(
      this.construct,
      'Parallel executtion of delete operations'
    );
    // 並行処理1: EC2インスタンスの削除
    this.addEC2Branch(mainParallel);
    // 並行処理2: RDSインスタンスの削除
    this.addRDSBranch(mainParallel);
    // ステートマシン作成
    const state = new sfn.StateMachine(
      this.construct,
      'YoigoshiYurusan StateMachine',
      {
        definition: mainParallel,
        logs: {
          destination: new LogGroup(this.construct, 'sfnLogGroups', {}),
        },
      }
    );
    // ステートマシン失敗時の通知
    this.failedNotificateEvent(state);
    // ステートマシンの定期実行
    this.addSchedulingEvent(state);
  }

  private addEC2Branch(mainParallel: sfn.Parallel) {
    // 並行処理1: EC2の削除
    const ec2Describe = new tasks.CallAwsService(
      this.construct,
      'Describe EC2 instances',
      {
        service: 'ec2',
        action: 'describeInstances',
        iamResources: ['*'],
        resultSelector: {
          'InstanceIDs.$':
            '$.Reservations[*].Instances[?(@.State.Code == 16)].InstanceId',
          'length.$':
            'States.ArrayLength($.Reservations[*].Instances[?(@.State.Code == 16)].InstanceId)',
        },
        parameters: {
          Filters: [
            {
              Name: 'instance-state-name',
              Values: ['running'],
            },
          ],
        },
      }
    );
    const ec2Terminate = new tasks.CallAwsService(
      this.construct,
      'Delete Terminate Instances',
      {
        service: 'ec2',
        action: 'terminateInstances',
        iamResources: ['*'],
        parameters: {
          'InstanceIds.$': '$.InstanceIDs',
        },
      }
    );
    const ec2choice = new sfn.Choice(this.construct, 'has terminate targets?');
    const noInstancesFinish = new sfn.Succeed(this.construct, 'no instances', {
      comment: 'exit because no target instances',
    });
    ec2choice
      .when(sfn.Condition.numberGreaterThan('$.length', 0), ec2Terminate)
      .otherwise(noInstancesFinish);
    mainParallel.branch(ec2Describe);
    ec2Describe.next(ec2choice);
  }

  private addRDSBranch(mainParallel: sfn.Parallel) {
    // 並行処理2: RDSインスタンスの削除
    const RdsLine = new tasks.CallAwsService(
      this.construct,
      'Describe RDS instances',
      {
        service: 'rds',
        action: 'describeDBInstances',
        iamResources: ['*'],
        outputPath:
          "$.DbInstances[?(@.DbInstanceStatus == 'available')].DbInstanceIdentifier",
        parameters: {},
      }
    );
    // 削除処理を繰り返し
    const iterMap = new sfn.Map(this.construct, 'Iterete delete DB Instances', {
      comment: 'Iterete Delete RDS Instances',
      maxConcurrency: 1,
    });
    // 削除処理
    const deleteInstance = new tasks.CallAwsService(
      this.construct,
      'Delete DB Instances',
      {
        service: 'rds',
        action: 'deleteDBInstance',
        iamResources: ['*'],
        parameters: {
          'DbInstanceIdentifier.$': '$',
          SkipFinalSnapshot: true,
        },
      }
    );
    iterMap.iterator(deleteInstance);
    const dbClusterSteps = this.getDBClusterStep();
    RdsLine.next(iterMap).next(dbClusterSteps);
    mainParallel.branch(RdsLine);
  }

  private getDBClusterStep(): sfn.Chain {
    // 並行処理3: DB Clusterの削除
    const clusterDescribe = new tasks.CallAwsService(
      this.construct,
      'Describe DBClusters',
      {
        service: 'rds',
        action: 'describeDBClusters',
        iamResources: ['*'],
        outputPath:
          "$.DbClusters[?(@.Status == 'available')].DbClusterIdentifier",
        parameters: {},
      }
    );
    // 削除処理を繰り返し
    const iterMap = new sfn.Map(this.construct, 'Iterete delete DB Clusters', {
      comment: 'Iterete Delete DBClusters',
      maxConcurrency: 1,
    });
    // 削除処理
    const deleteCluster = new tasks.CallAwsService(
      this.construct,
      'Delete DBClusters',
      {
        service: 'rds',
        action: 'deleteDBCluster',
        iamResources: ['*'],
        parameters: {
          'DbClusterIdentifier.$': '$',
          SkipFinalSnapshot: true,
        },
      }
    );
    iterMap.iterator(deleteCluster);
    return clusterDescribe.next(iterMap);
  }

  private failedNotificateEvent(stateMachine: sfn.StateMachine) {
    //EventBridge Rule
    const connection = new events.Connection(this.construct, 'Connection', {
      authorization: events.Authorization.apiKey(
        'Hoge',
        SecretValue.unsafePlainText('Fuga')
      ),
      description: 'Connection with API Key Token If Needed',
    });
    const destination = new events.ApiDestination(
      this.construct,
      'Destination',
      {
        connection,
        endpoint: process.env.ENDPOINT ?? '',
        description: 'Calling example.com with API key x-api-key',
      }
    );
    events.RuleTargetInput;
    const rule = new events.Rule(this.construct, 'slack notificxation rule', {
      eventPattern: {
        source: ['aws.states'],
        detailType: ['Step Functions Execution Status Change'],
        detail: {
          status: ['FAILED'],
          stateMachineArn: [stateMachine.stateMachineArn],
        },
      },
    });
    rule.addTarget(
      new targets.ApiDestination(destination, {
        event: events.RuleTargetInput.fromObject({
          attachments: [
            {
              fallback: ':alart:リソースの定期削除に失敗しました',
              pretext: 'リソースの定期削除に失敗しました',
              color: '#dc143c',
              fields: [
                {
                  title: `${events.EventField.fromPath(
                    '$.detail.stateMachineArn'
                  )}の実行に失敗`,
                  value: `${events.EventField.fromPath('$.detail.output')}`,
                },
              ],
            },
          ],
        }),
      })
    );
    return rule;
  }

  private addSchedulingEvent(stateMachine: sfn.StateMachine): events.Rule {
    const rule = new events.Rule(this.construct, 'MidNightSchedule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '16',
        day: '*',
      }),
      targets: [new targets.SfnStateMachine(stateMachine)],
    });
    return rule;
  }
}
