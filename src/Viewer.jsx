import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";

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

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 2, 3);
    scene.add(light);

    camera.position.z = 500;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    const center = getPointCloudCenter(points);

    const resolution = 48;
    const material = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.55,
      metalness: 0.05,
    });

    const surface = new MarchingCubes(resolution, material);
    surface.position.set(0, 0, 0);
    surface.scale.set(220, 220, 220);
    surface.isolation = 24;
    surface.reset();

    for (const point of points) {
      const x = ((point.x - center.x) / 420) + 0.5;
      const y = ((-point.y - center.y) / 420) + 0.5;
      const z = ((point.z - center.z) / 420) + 0.5;

      surface.addBall(x, y, z, 0.08, 12);
    }

    surface.update();
    scene.add(surface);

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
