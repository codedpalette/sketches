import { fromPolar } from "math/angles";
import { abs, atan, pi, tan } from "mathjs";
import { rectanglePacking } from "packing/rectangle";
import { Rectangle } from "paper";
import { Fog, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene } from "three";
import { radToDeg } from "three/src/math/MathUtils";
import { init, run } from "drawing/sketch";
import { createNoise4D } from "simplex-noise";

const noise = createNoise4D();
const params = init({ width: 700, height: 700 });
const loopDurationSeconds = 5;
const planeWidth = 2;
const planeHeight = 2;

//Calculate camera position
const holeScale = 0.25; //Relation between central hole and screen dimensions
const k = (1 - holeScale) / (2 * holeScale);
const fov = radToDeg(atan(k)) * 2;
const z = (planeWidth * 0.5) / k + planeWidth * 0.5;
const camera = new PerspectiveCamera(fov, params.width / params.height, 0.1, z + planeHeight);
camera.position.setZ(z);

const scene = new Scene();
scene.fog = new Fog(0x000000, 0, z + planeHeight / 2);

const geometry = new PlaneGeometry(1, 1);
const planes: Group[] = [];
const sides = 4; //TODO: recalculate formulas for dynamic number of slices
for (let i = 0; i < sides; i++) {
  const packing = rectanglePacking(new Rectangle(0, 0, planeWidth, planeHeight), 40);
  for (let j = 0; j < 3; j++) {
    const group = new Group();
    for (const rect of packing) {
      const material = new MeshBasicMaterial({ color: "white", depthWrite: true });
      const rectMesh = new Mesh(geometry, material);
      rectMesh.scale.set(rect.width, rect.height, 1);
      rectMesh.position.set(rect.center.x - planeWidth / 2, rect.center.y - planeHeight / 2, 0);
      group.add(rectMesh);
    }

    const apothem = planeWidth / (2 * tan(pi / sides));
    group
      .rotateX(-pi / 2)
      .rotateY((2 * pi * i) / sides)
      .translateZ(-apothem);
    group.position.z -= (j - 1) * planeHeight;
    planes.push(group);
    scene.add(group);
  }
}

const backTunnelMaterial = new MeshBasicMaterial({ color: "white" });
const backTunnel = new Mesh(geometry, backTunnelMaterial);
backTunnel.position.set(0, 0, -planeHeight / 2);
backTunnel.scale.set(planeWidth, planeHeight, 1);
scene.add(backTunnel);

const update = (deltaTime: number, elapsedTotal: number) => {
  const positionOffSet = (deltaTime * planeHeight) / loopDurationSeconds;
  const cameraRotation = (elapsedTotal * 2 * pi) / loopDurationSeconds;
  const cameraPosition = fromPolar(0.2 * planeWidth, cameraRotation);
  camera.position.set(cameraPosition.x, cameraPosition.y, camera.position.z);
  camera.lookAt(0, 0, 0);
  camera.rotateZ(-cameraRotation / 2);

  const noiseScaleFactor = 0.2;
  for (const plane of planes) {
    plane.position.z += positionOffSet;
    if (plane.position.z >= 2 * planeHeight) {
      plane.position.z -= planeHeight * (planes.length / sides);
    }
    for (const mesh of plane.children as Mesh[]) {
      const x = abs(mesh.position.x - planeWidth / 2) * noiseScaleFactor;
      const y = (plane.position.z + abs(mesh.position.y - planeHeight / 2)) * noiseScaleFactor;
      const z = abs((elapsedTotal % loopDurationSeconds) - loopDurationSeconds / 2) * noiseScaleFactor;

      const hue = noise(x, y, z, 0);
      const sat = 0.5 + noise(x, y, z, 100) / 2;
      const bri = 0.5 + noise(x, y, z, 200) / 5;

      (mesh.material as MeshBasicMaterial).color.setHSL(hue, sat, bri);
    }
  }
};

run({ scene, camera, update }, params);
