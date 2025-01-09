import { three } from "library/core/sketch"
import { AxesHelper, Color, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene } from "three"
import { OrbitControls } from "three/examples/jsm/Addons"

export default three(({ random, bbox, renderer }) => {
  const scene = new Scene()
  //const camera = new PerspectiveCamera(75, bbox.width / bbox.height, 0.1, 1000)
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.001, 1000)

  //const geometry = new BoxGeometry(1, 1, 1)
  const geometry = new PlaneGeometry(1, 1)
  const material = new MeshBasicMaterial({ color: new Color(...random.color()), side: DoubleSide })
  const cube = new Mesh(geometry, material)
  //cube.scale.set(1.5, 1.5, 1)
  cube.position.set(0.5, 0.5, 0)
  scene.add(cube)

  camera.position.set(2, 2, 1)
  camera.up.set(0, 0, 1)
  camera.lookAt(0, 0, 0)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0.5, 0.5, 0)
  controls.autoRotate = true
  const helper = new AxesHelper()
  scene.add(helper)

  function update(totalTime: number) {
    controls.update()
  }
  return { scene, camera, update }
})
