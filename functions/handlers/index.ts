import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeInstancesCommandOutput,
  StopInstancesCommand,
} from '@aws-sdk/client-ec2';
import { Context } from 'aws-lambda';

interface HandlerParameters {}

const ec2Client = new EC2Client({});

export const handler = async (
  event: HandlerParameters,
  context: Context
): Promise<void | Error> => {
  console.log(`Start Exectution...`);

  await ec2Client
    .send(new DescribeInstancesCommand({}))
    .then((instances) => {
      console.log(JSON.stringify(instances, null, 2));
    })
    .catch((error) => {
      console.error('Describe the EC2 Instance error!! \n\n', error);
    });

  return;
};

await function stopEC2Instances(
  ec2client: EC2Client,
  instances: DescribeInstancesCommandOutput[]
) {
  const idList = [];
  instances.map((instanceInfo) => {
    const reservations = instanceInfo.Reservations;
    const ids = reservations.map((reservation) => {
      const ids = reservation.Instances.map((instance) => {
        return instance.InstanceId;
      });
      idList.concat(ids);
    });
  });
  idList.forEach((id) => {
    ec2client
      .send(new StopInstancesCommand({ InstanceIds: idList }))
      .then((result) => {
        console.log('Successfully Stop Instance');
        console.log(result);
      })
      .catch((err) => {
        console.log('EC2 Instance StopError!!');
        console.log(err);
      });
  });
};
