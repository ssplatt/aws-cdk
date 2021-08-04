import { Template } from '@aws-cdk/assertions';
import * as ec2 from '@aws-cdk/aws-ec2';
import { Stack } from '@aws-cdk/core';
import { ClusterSubnetGroup } from '../lib';

let stack: Stack;
let vpc: ec2.IVpc;

beforeEach(() => {
  stack = new Stack();
  vpc = new ec2.Vpc(stack, 'VPC');
});

test('creates a subnet group from minimal properties', () => {
  new ClusterSubnetGroup(stack, 'Group', {
    description: 'MyGroup',
    vpc,
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Redshift::ClusterSubnetGroup', {
    Description: 'MyGroup',
    SubnetIds: [
      { Ref: 'VPCPrivateSubnet1Subnet8BCA10E0' },
      { Ref: 'VPCPrivateSubnet2SubnetCFCDAA7A' },
    ],
  });
});

describe('subnet selection', () => {
  test('defaults to private subnets', () => {
    new ClusterSubnetGroup(stack, 'Group', {
      description: 'MyGroup',
      vpc,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Redshift::ClusterSubnetGroup', {
      Description: 'MyGroup',
      SubnetIds: [
        { Ref: 'VPCPrivateSubnet1Subnet8BCA10E0' },
        { Ref: 'VPCPrivateSubnet2SubnetCFCDAA7A' },
      ],
    });
  });

  test('can specify subnet type', () => {
    new ClusterSubnetGroup(stack, 'Group', {
      description: 'MyGroup',
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Redshift::ClusterSubnetGroup', {
      Description: 'MyGroup',
      SubnetIds: [
        { Ref: 'VPCPublicSubnet1SubnetB4246D30' },
        { Ref: 'VPCPublicSubnet2Subnet74179F39' },
      ],
    });
  });
});

describe('import group', () => {
  test('from name', () => {
    const subnetGroup = ClusterSubnetGroup.fromClusterSubnetGroupName(stack, 'Group', 'my-subnet-group');

    expect(subnetGroup.clusterSubnetGroupName).toBe('my-subnet-group');
  });

  test('from attributes', () => {
    const selectedSubnets = vpc.selectSubnets();

    const subnetGroup = ClusterSubnetGroup.fromClusterSubnetGroupAttributes(stack, 'Group', { clusterSubnetGroupName: 'my-subnet-group', selectedSubnets: selectedSubnets });

    expect(subnetGroup.clusterSubnetGroupName).toBe('my-subnet-group');
    expect(subnetGroup.selectedSubnets).toBe(selectedSubnets);
  });
});
