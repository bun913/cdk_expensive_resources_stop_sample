import { Construct } from 'constructs';
import { aws_stepfunctions_tasks } from 'aws-cdk-lib';
import {
  Errors,
  IntegrationPattern,
  Pass,
  TaskStateBase,
  Fail,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { EcsFargateLaunchTarget } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { StepFunctionInvokeAction } from 'aws-cdk-lib/aws-codepipeline-actions';

export class StepFunc {
  readonly params: StepFunctionsParam;

  constructor(params: StepFunctionsParam) {
    this.params = params;
  }

  public createResources() {
    // Step1
    const okTask = this.getRunTaskParam('Step1 OKRun', this.params.okTaskDef, [
      sg,
    ]);
    const failStep1 = new Fail(this.params.scope, 'Step1Fail');
    okTask.addCatch(failStep1);
  }
}
