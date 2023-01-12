import { fromPolar } from "math/angles";
import { atan, pi, tan } from "mathjs";
import { rectanglePacking } from "packing/rectangle";
import { Rectangle } from "paper";
import {
  EdgesGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";
import { radToDeg } from "three/src/math/MathUtils";
import { getWebGL2ErrorMessage, isWebGL2Available } from "util/webgl";

const width = 1080;
const height = 1080;
const scene = new Scene();
//scene.add(new AxesHelper());
//scene.add(new GridHelper(1));

//Calculate camera position
const holeScale = 0.3; //Relation between central hole and screen dimensions
const k = (1 - holeScale) / (2 * holeScale);
const fov = radToDeg(atan(k)) * 2;
const z = 1 / k + 1;
const camera = new PerspectiveCamera(fov, width / height, 0.1, z + 1);
camera.position.setZ(z);

const material = new MeshBasicMaterial({ color: "lightgreen", depthWrite: false });
const lineMaterial = new LineMaterial({ color: 0x006400, linewidth: 0.0025 });

const geometry = new PlaneGeometry(1, 1);
const edgesGeometry = new LineSegmentsGeometry().fromEdgesGeometry(new EdgesGeometry(geometry));
const planes: Group[] = [];

const planeWidth = 2;
const planeHeight = 2;
const sides = 4; //TODO: recalculate formulas for dynamic number of slices
for (let i = 0; i < sides; i++) {
  const packing = rectanglePacking(new Rectangle(0, 0, planeWidth, planeHeight), 20);
  for (let j = 0; j < 3; j++) {
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
const backTunnel = new Mesh(geometry, material).add(new LineSegments2(edgesGeometry, lineMaterial));
backTunnel.position.set(0, 0, -planeHeight / 2);
backTunnel.scale.set(planeWidth, planeHeight, 1);
scene.add(backTunnel);

const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const loopDurationSeconds = 5;
let cameraRotation = 0;
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = 1 / 60; //60FPS
  const offSet = (deltaTime * planeHeight) / loopDurationSeconds;

  const cameraOffset = (deltaTime * 2 * pi) / loopDurationSeconds;
  cameraRotation += cameraOffset;
  const cameraPosition = fromPolar(0.3, cameraRotation);
  camera.position.set(cameraPosition.x, cameraPosition.y, camera.position.z);
  camera.rotateZ(cameraOffset / 2);

  for (const plane of planes) {
    plane.position.z += offSet;
    if (plane.position.z >= 2 * planeHeight) {
      plane.position.z -= planeHeight * 3;
    }
  }
  renderer.render(scene, camera);
}

if (isWebGL2Available()) animate();
else document.body.appendChild(getWebGL2ErrorMessage());
