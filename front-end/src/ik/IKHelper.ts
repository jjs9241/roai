import {
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
  MeshBasicMaterial,
  Mesh,
  CylinderGeometry,
  AxesHelper,
  Material,
  Object3D,
} from 'three';


import AXIS_NAMES from '../constants/axisNames';
import { HALF_PI } from '../constants/math';
import type IKChain from './IKChain';
import type IKJoint from './IKJoint';

const COLOR = 0x0092ff;
const LINK_SIZE = {
  tubularSegments: 64,
  radius: 0.001,
  radialSegments: 8,
};
const JOINT_SIZE = {
  radius: 0.01,
  height: 0.05,
  radialSegments: 8,
};

interface IKHelperConfig {
  linkWidth?: number;
  linkRoundness?: number;
  linkColor?: number;
  jointRadius?: number;
  jointHeight?: number;
  jointRoundness?: number;
  JointColor?: number;
}

class IKHelper {
  private ikJoints: IKJoint[];
  private config: IKHelperConfig;
  private linkMaterial: Material;
  private jointMaterial: Material;

  constructor(ikChain: IKChain, config = {}) {
    this.ikJoints = ikChain.ikJoints;
    this.config = config;
    this.linkMaterial = this._createLinkMaterial();
    this.jointMaterial = this._createJointMaterial();
  }

  visualizeIKChain() {
    const jointGeometry = this._createJointGeometry();

    let parent: Object3D | null = this.ikJoints[0].parent;
    if (!parent) throw new Error('ikJoints[0] has no parent');

    for (let idx = 0; idx < this.ikJoints.length; idx++) {
      const ikJoint = this.ikJoints[idx];

      const linkGeometry = this._createLinkGeometry(ikJoint.position);
      const link = new Mesh(linkGeometry, this.linkMaterial);
      parent.add(link);

      parent = ikJoint;

      if (idx === 0 || idx === this.ikJoints.length - 1) {
        continue;
      }

      const joint = new Mesh(jointGeometry, this.jointMaterial);

      if (ikJoint.axisName === AXIS_NAMES.Z) {
        joint.rotateX(HALF_PI);
      }

      const axesHelper = new AxesHelper(0.1);
      ikJoint.add(axesHelper);

      ikJoint.add(joint);
    }
  }

  _createLinkGeometry(endPoint: Vector3) {
    const startPoint = new Vector3(0, 0, 0);
    const linkPathPoints = [startPoint, endPoint];
    const linkPath = new CatmullRomCurve3(linkPathPoints);
    const radius = this.config.linkWidth! / 2 || LINK_SIZE.radius;
    const radialSegments =
      this.config.linkRoundness || LINK_SIZE.radialSegments;
    return new TubeGeometry(
      linkPath,
      LINK_SIZE.tubularSegments,
      radius,
      radialSegments
    );
  }

  _createLinkMaterial() {
    const material = new MeshBasicMaterial({
      color: this.config.linkColor || COLOR,
    });
    return material;
  }

  _createJointGeometry() {
    const radiusTop = this.config.jointRadius || JOINT_SIZE.radius;
    const radiusBottom = radiusTop;
    const height = this.config.jointHeight || JOINT_SIZE.height;
    const radialSegments =
      this.config.jointRoundness || JOINT_SIZE.radialSegments;
    return new CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments
    );
  }

  _createJointMaterial() {
    const material = new MeshBasicMaterial({
      color: this.config.JointColor || COLOR,
    });
    return material;
  }
}

export default IKHelper;
