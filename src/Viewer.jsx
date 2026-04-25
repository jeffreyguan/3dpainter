import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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

    for (const point of points) {
      const geometry = new THREE.BoxGeometry(3, 12, 12);
      const material = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const box = new THREE.Mesh(geometry, material);

      box.position.set(point.x, -point.y, point.z);
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
