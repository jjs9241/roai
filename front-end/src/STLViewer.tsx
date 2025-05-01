import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three-stdlib";

const STLViewer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const width = mountRef.current?.clientWidth || 400;
    const height = mountRef.current?.clientHeight || 400;
    renderer.setSize(width, height);
    mountRef.current?.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x888888);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);

    const loader = new STLLoader();
    loader.load("/example.stl", (geometry) => {
      const material = new THREE.MeshPhongMaterial({ color: 0x0055ff });
      const mesh = new THREE.Mesh(geometry, material);
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox?.getCenter(center);
      mesh.position.sub(center);
      scene.add(mesh);

      animate();
    });

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

export default STLViewer;
