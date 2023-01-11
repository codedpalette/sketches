import { atan, pi } from "mathjs";
import { rectanglePacking } from "packing/rectangle";
import { Rectangle } from "paper";
import {
  BufferGeometry,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
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
const lineMaterial = new LineBasicMaterial({ color: "darkgreen" }); //TODO: Lines appear dashed - look at examples
const geometry = new PlaneGeometry(1, 1);
const planes: Group[] = [];

const planeWidth = 2;
const planeHeight = 2;
for (let i = 0; i < 4; i++) {
  const packing = rectanglePacking(new Rectangle(0, 0, planeWidth, planeHeight), 20);
  for (let j = 0; j < 2; j++) {
    const edgeGeometries: BufferGeometry[] = [];
    const group = new Group();
    for (const rect of packing) {
      const rectMesh = new Mesh(geometry, material);
      rectMesh.scale.set(rect.width, rect.height, 1);
      rectMesh.position.set(rect.center.x - planeWidth / 2, rect.center.y - planeHeight / 2, 0);

      edgeGeometries.push(
        new EdgesGeometry(rectMesh.geometry)
          .scale(rectMesh.scale.x, rectMesh.scale.y, 1)
          .translate(rectMesh.position.x, rectMesh.position.y, 0)
      );
      group.add(rectMesh);
    }

    group.add(new LineSegments(mergeBufferGeometries(edgeGeometries), lineMaterial));
    group
      .rotateX(-pi / 2)
      .rotateY((pi * i) / 2)
      .translateZ(-1);
    if (j) group.position.z -= planeHeight;
    planes.push(group);
    scene.add(group);
  }
}

const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(width, height);
renderer.setClearColor("white");
document.body.appendChild(renderer.domElement);

const loopDurationSeconds = 5;
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = 1 / 60; //60FPS
  const offSet = (deltaTime * planeHeight) / loopDurationSeconds;
  for (const plane of planes) {
    plane.position.z += offSet;
    if (plane.position.z >= planeHeight) {
      plane.position.z -= planeHeight * 2;
    }
  }
  renderer.render(scene, camera);
}

if (isWebGL2Available()) animate();
else document.body.appendChild(getWebGL2ErrorMessage());
