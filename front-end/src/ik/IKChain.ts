import IKJoint from './IKJoint';
import type { Group } from 'three';

interface URDFJointNode {
  id: string;
  jointType: string;
  position: any;
  rotation: any;
  axis: any;
  limit: {
    lower: number;
    upper: number;
  };
  children?: URDFJointNode[];
  isURDFJoint?: boolean;
}

export interface URDFRobot {
  children: URDFJointNode[];
}

class IKChain {
  private _ikJoints: IKJoint[] = [];
  private _urdfJoints: URDFJointNode[] = [];
  private _rootJoint: IKJoint | null = null;
  private _urdfBaseJointId: string = '';
  private _endEffector: IKJoint | null = null;

  constructor() {
    this._ikJoints = [];
    this._urdfJoints = [];
    this._rootJoint = null;
    this._urdfBaseJointId = '';
    this._endEffector = null;
  }

  addJoint(parent: Group, ikJoint: IKJoint) {
    parent.add(ikJoint);
    this._ikJoints.push(ikJoint);
  }

  get ikJoints() {
    return this._ikJoints;
  }

  get rootJoint() {
    return this._rootJoint;
  }

  get endEffector() {
    return this._endEffector;
  }

  get urdfJoints() {
    return this._urdfJoints;
  }

  createFromURDFRobot(urdfRobot: URDFRobot, rootJointParent: Group): IKChain {
    this._rootJoint = new IKJoint();
    this.addJoint(rootJointParent, this._rootJoint);

    const urdfRobotBaseJoint = this._findURDFBaseJoint(urdfRobot);
    this._urdfBaseJointId = urdfRobotBaseJoint.id;

    this._traverseURDFJoints(this._rootJoint, urdfRobotBaseJoint);

    return this;
  }

  private _findURDFBaseJoint({ children }: URDFRobot): URDFJointNode {
    let baseJoint: URDFJointNode | null = null;
    for (const child of children) {
      if (!child.isURDFJoint) continue;

      const [urdfLink] = child.children ?? [];
      const hasNextURDFJoint = urdfLink?.children?.some(
        (child) => child.isURDFJoint
      );
      if (hasNextURDFJoint) {
        baseJoint = child;
        break;
      }
    }

    if (!baseJoint) throw new Error('Base joint not found');
    return baseJoint;
  }

  private _traverseURDFJoints(
    parentIkJoint: IKJoint,
    urdfJoint: URDFJointNode
  ): void {
    this._urdfJoints.push(urdfJoint);

    const ikJoint = new IKJoint(urdfJoint);
    this.addJoint(parentIkJoint, ikJoint);
    parentIkJoint = ikJoint;

    const [urdfLink] = urdfJoint.children ?? [];
    const children = urdfLink?.children ?? [];
    const nextUrdfJoint = children.find(
      (child: URDFJointNode) => child.isURDFJoint
    );

    const isEndEffector =
      ikJoint.isFixed && urdfJoint.id !== this._urdfBaseJointId;

    if (!nextUrdfJoint || isEndEffector) {
      this._endEffector = ikJoint;
      return;
    }

    this._traverseURDFJoints(parentIkJoint, nextUrdfJoint);
  }
}

export default IKChain;
