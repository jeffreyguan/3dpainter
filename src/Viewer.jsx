import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

function getPointCloudCenter(points) {
  if (points.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const bounds = points.reduce(
    (currentBounds, point) => ({
      minX: Math.min(currentBounds.minX, point.x),
      maxX: Math.max(currentBounds.maxX, point.x),
      minY: Math.min(currentBounds.minY, -point.y),
      maxY: Math.max(currentBounds.maxY, -point.y),
      minZ: Math.min(currentBounds.minZ, point.z),
      maxZ: Math.max(currentBounds.maxZ, point.z),
    }),
    {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
      minZ: Infinity,
      maxZ: -Infinity,
    },
  );

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2,
  };
}

export default function Viewer({ points = [] }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(600, 600);
    mount.appendChild(renderer.domElement);
    scene.background = new THREE.Color(0xffffff);

    camera.position.z = 500;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    const center = getPointCloudCenter(points);

    for (const point of points) {
      const geometry = new THREE.BoxGeometry(8, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const box = new THREE.Mesh(geometry, material);

      box.position.set(point.x - center.x, -point.y - center.y, point.z - center.z);
      scene.add(box);
    }

    function animate() {
      controls.update();
      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(animate);

    return () => {
      renderer.setAnimationLoop(null);
      controls.dispose();
      renderer.dispose();
      mount.replaceChildren();
    };
  }, [points]);

  return <div className="viewer" ref={mountRef} />;
}
