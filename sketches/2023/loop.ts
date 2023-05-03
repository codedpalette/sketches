import { abs, atan, pi, tan } from "mathjs";
import { rectanglePacking } from "geometry/packing/rectangle";
import { Rectangle } from "paper";
import { Fog, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene } from "three";
import { radToDeg } from "three/src/math/MathUtils";
import { run } from "drawing/sketch";
import { fromPolar } from "geometry/angles";
import { noise4d } from "util/random";

run((params) => {
  const loopDurationSeconds = 5;
  const planeDim = 2;
  const sides = 4;
  const rectanglesPerSide = 30;
  const holeScale = 0.2; //Relation between central hole and screen dimensions
  const apothem = planeDim / (2 * tan(pi / sides));

  const camera = configureCamera(holeScale);
  const scene = new Scene();
  scene.fog = new Fog(0x000000, 0, camera.far - planeDim / 2);

  const geometry = new PlaneGeometry(1, 1);
  const planeGroup = createPlaneGroup();
  const planes: Group[] = [];
  for (let i = 0; i < sides; i++) {
    for (let j = 0; j < 5; j++) {
      const group = planeGroup.clone();
      group
        .rotateX(-pi / 2)
        .rotateY((2 * pi * i) / sides)
        .translateZ(-apothem);
      group.position.z -= (j - 2) * planeDim;
      planes.push(group);
      scene.add(group);
    }
  }

  const update = (deltaTime: number, elapsedTotal: number) => {
    const positionOffSet = (deltaTime * planeDim) / loopDurationSeconds;
    const cameraRotation = (elapsedTotal * 2 * pi) / (loopDurationSeconds * 2);
    const cameraPosition = fromPolar(apothem * 0.5, cameraRotation);
    camera.position.setX(cameraPosition.x);
    camera.position.setY(cameraPosition.y);
    camera.position.z -= positionOffSet;
    if (camera.position.z <= 0) {
      camera.position.z += planeDim;
    }
    camera.lookAt(0, 0, camera.position.z - planeDim);
    camera.rotateZ(-cameraRotation / 2);

    const noiseScaleFactor = 0.3;
    for (const mesh of planeGroup.children as Mesh[]) {
      const x = abs(mesh.position.x) * noiseScaleFactor;
      const y = abs(mesh.position.y) * noiseScaleFactor;
      const z = abs((elapsedTotal % loopDurationSeconds) * 2 - loopDurationSeconds) * noiseScaleFactor;

      const hue = noise4d(x, y, z, 0);
      const sat = 0.5 + noise4d(x, y, z, 100) / 4;
      const bri = 0.5 + noise4d(x, y, z, 200) / 4;

      (mesh.material as MeshBasicMaterial).color.setHSL(hue, sat, bri);
    }
  };

  return { scene, camera, update };

  function createPlaneGroup(): Group {
    const packing = rectanglePacking(new Rectangle(0, 0, planeDim, planeDim), rectanglesPerSide);
    const group = new Group();
    for (const rect of packing) {
      const material = new MeshBasicMaterial({ color: "white", depthWrite: true });
      const rectMesh = new Mesh(geometry, material);
      rectMesh.scale.set(rect.width, rect.height, 1);
      rectMesh.position.set(rect.center.x - planeDim / 2, rect.center.y - planeDim / 2, 0);
      group.add(rectMesh);
    }
    return group;
  }

  function configureCamera(holeScale: number, cameraToUpdate?: PerspectiveCamera) {
    const k = (1 - holeScale) / (2 * holeScale);
    const fov = radToDeg(atan(k)) * 2;
    const z = apothem * (1 / k + 1);
    const far = z + planeDim;
    if (cameraToUpdate) {
      cameraToUpdate.fov = fov;
      cameraToUpdate.far = z + planeDim;
      cameraToUpdate.updateProjectionMatrix();
    }
    const camera = cameraToUpdate ?? new PerspectiveCamera(fov, params.width / params.height, 0.1, far);
    camera.position.setZ(z);
    return camera;
  }
});
