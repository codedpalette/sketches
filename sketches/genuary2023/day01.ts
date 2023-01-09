import { Sketch2D } from "drawing/sketch";
import { multiply, pi, round } from "mathjs";
import { rectanglePacking } from "packing/rectangle";
import { Rectangle } from "paper";
import { Container, DisplayObject, Graphics, SimplePlane } from "pixi.js";
import {
  AxesHelper,
  DirectionalLight,
  GridHelper,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from "three";
import { getWebGL2ErrorMessage, isWebGL2Available } from "util/webgl";

const fov = 75;
const farClip = 5;
const width = 1080;
const height = 1080;
const scene = new Scene();
const camera = new PerspectiveCamera(fov, width / height, 0.1, farClip);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(width, height, false);
document.body.appendChild(renderer.domElement);

const light = new DirectionalLight(0xffffff, 2);
light.position.set(-1, 2, 4);
scene.add(light);

const geometry = new PlaneGeometry(2, 2);
const material = new MeshPhongMaterial({ color: 0x00ff00 });
const plane = new Mesh(geometry, material);
plane.position.set(0, -1, -2.3);
plane.rotateX(-pi / 2);
scene.add(plane);

const axesHelper = new AxesHelper();
axesHelper.position.copy(plane.position);
scene.add(axesHelper);
const gridHelper = new GridHelper(1);
gridHelper.position.copy(plane.position);
scene.add(gridHelper);

function animate() {
  requestAnimationFrame(animate);
  //cube.rotation.x += 0.01;
  //cube.rotation.y += 0.01;
  //plane.position.z += 0.01;
  if (plane.position.z >= 2) {
    plane.position.setZ(plane.position.z - 2);
  }
  renderer.render(scene, camera);
}
if (isWebGL2Available()) {
  animate();
} else {
  document.body.appendChild(getWebGL2ErrorMessage());
}

class Day01 extends Sketch2D {
  private renderTexture = this.app.renderer.generateTexture(this.generateInfinitePacking());
  private loopDurationSeconds = 10;

  protected setup(): Container<DisplayObject> {
    const container = new Container();
    const plane = new SimplePlane(this.renderTexture, 100, 100);
    plane.position = { x: -this.width / 2, y: -this.height / 2 };

    const vertexBuffer = plane.geometry.getBuffer("aVertexPosition");
    const matrix = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const [xFactor, yFactor] = [plane.width, plane.height];
    for (let i = 0; i < vertexBuffer.data.length; i += 2) {
      const coords = [vertexBuffer.data[i] / xFactor, vertexBuffer.data[i + 1] / yFactor];
      const vec3 = [...coords, 1];
      const transformed = multiply(matrix, vec3);
      vertexBuffer.data[i] = (transformed[0] * xFactor) / transformed[2];
      vertexBuffer.data[i + 1] = (transformed[1] * yFactor) / transformed[2];
    }
    vertexBuffer.update();

    container.addChild(plane);
    return container;
  }

  protected update(deltaTime: number): void {
    const offSetPixels = round((deltaTime * this.height) / this.loopDurationSeconds); //TODO: Google how to do offsets
    this.renderTexture.frame.y += offSetPixels;
    if (this.renderTexture.frame.y >= this.height) {
      this.renderTexture.frame.y -= this.height;
    }
    this.renderTexture.updateUvs();
  }

  private generateInfinitePacking(): Container<Graphics> {
    const graphics = new Graphics();
    graphics.lineStyle(1, 0x000000);
    const rects = rectanglePacking(new Rectangle(0, 0, this.width, this.height), 20);
    for (const rect of rects) {
      graphics.drawRect(rect.x, rect.y, rect.width, rect.height);
    }

    const backupGraphics = graphics.clone();
    backupGraphics.position = { x: 0, y: this.height };
    const container = new Container<Graphics>();
    container.addChild(backupGraphics);
    container.addChild(graphics);
    return container;
  }
}

//new Day01({ debug: true }).run();
