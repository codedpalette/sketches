import { box } from "@flatten-js/core"
import { noise4d } from "library/core/random"
import { three } from "library/core/sketch"
import { rectanglePacking } from "library/geometry/packing"
import { fromPolar, radToDeg } from "library/utils"
import { Color, Fog, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene } from "three"

export default three(({ random, bbox }) => {
  const noise = noise4d(random)
  const loopDurationSeconds = 5
  const planeDim = 2
  const sides = 4 //random.integer(4, 8)
  const rectanglesPerSide = 30
  const holeScale = random.real(0.2, 0.3) //Relation between central hole and screen dimensions
  const apothem = planeDim / (2 * Math.tan(Math.PI / sides))

  const camera = configureCamera(holeScale)
  const scene = new Scene()
  scene.fog = new Fog(0x000000, 0, camera.far - planeDim / 2)

  const geometry = new PlaneGeometry(1, 1)
  const planeGroup = createPlaneGroup()
  const planes: Group[] = []
  for (let i = 0; i < sides; i++) {
    for (let j = 0; j < 5; j++) {
      const group = planeGroup.clone()
      group
        .rotateX(-Math.PI / 2)
        .rotateY((2 * Math.PI * i) / sides)
        .translateZ(-apothem)
      group.position.z -= (j - 2) * planeDim
      planes.push(group)
      scene.add(group)
    }
  }

  const update = (totalTime: number, deltaTime: number) => {
    const positionOffSet = (deltaTime * planeDim) / loopDurationSeconds
    const cameraRotation = (totalTime * 2 * Math.PI) / (loopDurationSeconds * 2)
    const cameraPosition = fromPolar(apothem * 0.5, cameraRotation)
    camera.position.setX(cameraPosition.x)
    camera.position.setY(cameraPosition.y)
    camera.position.z -= positionOffSet
    if (camera.position.z <= 0) {
      camera.position.z += planeDim
    }
    camera.lookAt(0, 0, camera.position.z - planeDim)
    camera.rotateZ(-cameraRotation / 2)

    const noiseScaleFactor = 0.3
    for (const mesh of planeGroup.children as Mesh[]) {
      const x = Math.abs(mesh.position.x) * noiseScaleFactor
      const y = Math.abs(mesh.position.y) * noiseScaleFactor
      const z = Math.abs((totalTime % loopDurationSeconds) * 2 - loopDurationSeconds) * noiseScaleFactor

      const hue = noise(x, y, z, 0)
      const sat = 0.5 + noise(x, y, z, 100) / 4
      const bri = 0.5 + noise(x, y, z, 200) / 4

      ;(mesh.material as MeshBasicMaterial).color.setHSL(hue, sat, bri)
    }
  }

  return { scene, camera, update }

  function createPlaneGroup(): Group {
    // TODO: Instanced mesh
    const packing = rectanglePacking(box(0, 0, planeDim, planeDim), planeDim / rectanglesPerSide, random)
    console.log(packing.length)
    const group = new Group()
    for (const rect of packing) {
      const material = new MeshBasicMaterial({ color: new Color(...random.color()), depthWrite: true })
      const rectMesh = new Mesh(geometry, material)
      rectMesh.scale.set(rect.width, rect.height, 1)
      rectMesh.position.set(rect.center.x - planeDim / 2, rect.center.y - planeDim / 2, 0)
      group.add(rectMesh)
    }
    return group
  }

  function configureCamera(holeScale: number) {
    const k = (1 - holeScale) / (2 * holeScale)
    const fov = radToDeg(Math.atan(k)) * 2
    const z = apothem * (1 / k + 1)
    const far = z + planeDim
    const camera = new PerspectiveCamera(fov, bbox.width / bbox.height, 0.1, far)
    camera.position.setZ(z)
    return camera
  }
})
