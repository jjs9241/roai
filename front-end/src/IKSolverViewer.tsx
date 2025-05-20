import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader, OrbitControls, TransformControls } from "three-stdlib";
import URDFLoader, { URDFRobot as LoaderURDFRobot } from 'urdf-loader';
import { XacroLoader } from 'xacro-parser';
import IKSolver from "./ik/IKSolver";
import { KUKA_URL, STAUBLI_URL, STAUBLI_PACKAGES_URLS } from "./constants/robotFilePaths";
import IKChain, {URDFRobot} from "./ik/IKChain";
import { HALF_PI } from "./constants/math";
import IKHelper from "./ik/IKHelper";
import IKJoint from "./ik/IKJoint";

const Viewer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const width = mountRef.current?.clientWidth || 400;
    const height = mountRef.current?.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.01,
      1000
    );
    camera.position.set(5, 5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mountRef.current?.appendChild(renderer.domElement);

    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.minDistance = 0.1;
    orbitControls.target.y = 1;
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.25;

    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed' as any, (evt) => {
      orbitControls.enabled = !evt.value;
    });
    const movingTarget = new THREE.Object3D();
    transformControls.attach(movingTarget);

    const loadingManager = new THREE.LoadingManager();
    const urdfLoader = new URDFLoader(loadingManager);
    const xacroLoader = new XacroLoader();

    let robot: URDFRobot & LoaderURDFRobot;
    let robotGroup: THREE.Group;
    const ikSolver = new IKSolver({ shouldUpdateURDFRobot: true });
    ikSolver.target = movingTarget;
    transformControls.addEventListener('objectChange' as any, () => {
      ikSolver.solve();
    });

    let isLoading = false;

    function loadURDFRobot(isKuka: boolean) {
      if (isLoading) return;

      isLoading = true;

      if (robot) {
        const robotGroupID = scene.getObjectById(robotGroup.id);
        if(robotGroupID) scene.remove(robotGroupID);
      }

      if (isKuka) {
        urdfLoader.load(KUKA_URL, (result) => {
          robot = result as any;
          isLoading = false;
        });
      } else {
        // Handle `xacro:include filename='...'` in XACRO file.
        (xacroLoader as any).rospackCommands = {
          find(pkg: any) {
            switch (pkg) {
              case 'staubli_resources':
                return STAUBLI_PACKAGES_URLS.staubli_resources;
              case 'staubli_tx2_90_support':
                return STAUBLI_PACKAGES_URLS.staubli_tx2_90_support;
              default:
                return pkg;
            }
          },
        };

        xacroLoader.load(STAUBLI_URL, (xml) => {
          urdfLoader.packages = {
            staubli_tx2_90_support: STAUBLI_PACKAGES_URLS.staubli_tx2_90_support,
          };
          robot = urdfLoader.parse(xml) as any;
          isLoading = false;
        }, () => {
          console.error(`xacroLoader.load error. STAUBLI_URL is ${STAUBLI_URL}`)
        });
      }
    }
    loadURDFRobot(true);
    console.log('after load urdf robot')

    loadingManager.onLoad = () => {
      console.log('robot:::', robot);

      robot.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.transparent = true;
          child.material.opacity = 0.5;
        }
        child.castShadow = true;
      });

      robotGroup = new THREE.Group();
      robotGroup.add(robot);

      const ikChain = new IKChain();
      ikChain.createFromURDFRobot(robot, robotGroup);

      robotGroup.rotateX(-HALF_PI);
      scene.add(robotGroup);

      ikSolver.ikChain = ikChain;
      if(ikChain.endEffector) setMovingTargetPosition(ikChain.endEffector);

      const ikHelper = new IKHelper(ikChain);
      ikHelper.visualizeIKChain();
    };

    const endEffectorWorldPosition = new THREE.Vector3();

    function setMovingTargetPosition(endEffector: IKJoint) {
      const movingTargetInScene = scene.getObjectById(movingTarget.id);
      if (!movingTargetInScene) {
        scene.add(movingTarget);
        scene.add(transformControls);
      }

      endEffector.getWorldPosition(endEffectorWorldPosition);
      movingTarget.position.copy(endEffectorWorldPosition);
    }

    const ambientLight = new THREE.AmbientLight(0x888888);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);

    // const loader = new STLLoader();
    // loader.load("/example.stl", (geometry) => {
    //   const material = new THREE.MeshPhongMaterial({ color: 0x0055ff });
    //   const mesh = new THREE.Mesh(geometry, material);
    //   geometry.computeBoundingBox();
    //   const center = new THREE.Vector3();
    //   geometry.boundingBox?.getCenter(center);
    //   mesh.position.sub(center);
    //   scene.add(mesh);

    //   animate();
    // });

    const animate = () => {
      requestAnimationFrame(animate);
      orbitControls.update();
      transformControls.update()
      renderer.render(scene, camera);
    };

    animate()

    return () => {
      orbitControls.dispose();
      transformControls.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

export default Viewer;
