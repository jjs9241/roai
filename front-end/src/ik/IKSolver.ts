import ccdIKSolver from './ccdIKSolver';

import type IKChain from './IKChain'; // 추정
import type { Object3D, Euler } from 'three'; // target으로 사용되는 타입 추정

interface IKSolverConfig {
  isHybrid?: boolean;
  tolerance?: number;
  maxNumOfIterations?: number;
  shouldUpdateURDFRobot?: boolean;
}

class IKSolver {
  private _ikChain: IKChain | null;
  private _target: Object3D | null;

  public isHybrid: boolean;
  public tolerance: number;
  public maxNumOfIterations: number;
  public shouldUpdateURDFRobot: boolean;

  constructor(config: IKSolverConfig = {}) {
    this._ikChain = null;
    this._target = null;

    this.isHybrid = config.isHybrid || false;
    this.tolerance = config.tolerance || 0.01;
    this.maxNumOfIterations = config.maxNumOfIterations || 10;
    this.shouldUpdateURDFRobot = config.shouldUpdateURDFRobot || false;
  }

  get ikChain(): IKChain | null {
    return this._ikChain;
  }

  set ikChain(newIkChain: IKChain | null) {
    this._ikChain = newIkChain;
  }

  get target(): Object3D | null {
    return this._target;
  }

  set target(newTarget: Object3D | null) {
    this._target = newTarget;
  }

  setConfig(config: Partial<IKSolverConfig>) {
    for (const key in config) {
      if (Object.prototype.hasOwnProperty.call(config, key)) {
        // @ts-ignore: dynamically assigned property (safe under known config keys)
        this[key] = config[key as keyof IKSolverConfig];
      }
    }
  }

  solve() {
    if (!this.ikChain || !this.target) return;

    ccdIKSolver(
      this.ikChain,
      this.target.position,
      this.tolerance,
      this.maxNumOfIterations
    );

    if (this.shouldUpdateURDFRobot) {
      this._updateURDFRobot();
    }
  }

  _updateURDFRobot() {
    if (this.ikChain === null) return
    const { ikJoints, urdfJoints } = this.ikChain;
    for (let idx = 0; idx < urdfJoints.length; idx++) {
      const ikJoint = ikJoints[idx + 1];
      const urdfJoint = urdfJoints[idx];

      urdfJoint.rotation.copy(ikJoint.rotation);
    }
  }
}

export default IKSolver;
