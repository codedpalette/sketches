import { fromPolar } from "math/angles";
import { atan, pi, tan } from "mathjs";
import { rectanglePacking } from "packing/rectangle";
import { Rectangle } from "paper";
import { EdgesGeometry, Fog, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene } from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";
import { radToDeg } from "three/src/math/MathUtils";
import { init, run } from "drawing/sketch";

const params = init();

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

const material = new MeshBasicMaterial({ color: "lightgreen", depthWrite: false });
const lineMaterial = new LineMaterial({ color: 0x006400, linewidth: 0.0025 }); //TODO: Affect by light
const geometry = new PlaneGeometry(1, 1);
const edgesGeometry = new LineSegmentsGeometry().fromEdgesGeometry(new EdgesGeometry(geometry));
const planes: Group[] = [];

const sides = 4; //TODO: recalculate formulas for dynamic number of slices
for (let i = 0; i < sides; i++) {
  const packing = rectanglePacking(new Rectangle(0, 0, planeWidth, planeHeight), 20);
  for (let j = 0; j < 4; j++) {
    const group = new Group();
    for (const rect of packing) {
      const rectMesh = new Mesh(geometry, material).add(new LineSegments2(edgesGeometry, lineMaterial));
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

const backTunnelMaterial = material.clone();
backTunnelMaterial.depthWrite = true;
const backTunnel = new Mesh(geometry, backTunnelMaterial).add(new LineSegments2(edgesGeometry, lineMaterial));
backTunnel.position.set(0, 0, -planeHeight / 2);
backTunnel.scale.set(planeWidth, planeHeight, 1);
scene.add(backTunnel);

const update = (deltaTime: number, elapsedTotal: number) => {
  const positionOffSet = (deltaTime * planeHeight) / loopDurationSeconds;
  const cameraRotation = (elapsedTotal * 2 * pi) / loopDurationSeconds;
  const cameraPosition = fromPolar(0.3 * planeWidth, cameraRotation);
  camera.position.set(cameraPosition.x, cameraPosition.y, camera.position.z);
  camera.lookAt(0, 0, 0);
  camera.rotateZ(-cameraRotation / 2);

  for (const plane of planes) {
    plane.position.z += positionOffSet;
    if (plane.position.z >= 2 * planeHeight) {
      plane.position.z -= planeHeight * 4;
    }
  }
};

run({ scene, camera, update }, params);
