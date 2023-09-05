import { glsl, linkBundle, setPreamble } from "@use-gpu/shader/glsl"
import { FunctionRef, ShaderModule } from "@use-gpu/shader/mjs/glsl/types"
import {
  Arrays,
  createBufferInfoFromArrays,
  createProgramInfo,
  createVertexArrayInfo,
  drawBufferInfo,
  ProgramInfo,
  setBuffersAndAttributes,
  setUniforms,
  VertexArrayInfo,
} from "twgl.js"

export type ModelDef = {
  geometry: Arrays
  material: { vert: ShaderModule; frag: ShaderModule }
  uniforms?: object
}

export type Model = {
  programInfo: ProgramInfo
  vertexArrayInfo: VertexArrayInfo
  uniforms?: object
}

setPreamble("#version 300 es\nprecision mediump float;")

export function createModel(gl: WebGL2RenderingContext, { geometry, material, uniforms }: ModelDef): Model {
  const fragReturnType = getEntryPointReturnType(material.frag)
  const vs = linkBundle(mainVert, material, { ...globalDefines, VERT: 1 })
  const fs = linkBundle(mainFrag, material, {
    ...globalDefines,
    FRAG: 1,
    USE_ALPHA: fragReturnType == "vec4" ? 1 : 0,
  })
  const programInfo = createProgramInfo(gl, [vs, fs])
  // Using vertex array to not pollute global buffer state
  const vertexArrayInfo = createVertexArrayInfo(gl, programInfo, createBufferInfoFromArrays(gl, geometry))
  return { programInfo, vertexArrayInfo, uniforms }
}

export function renderModels(gl: WebGL2RenderingContext, ...models: Model[]) {
  for (const model of models) {
    const { programInfo, vertexArrayInfo, uniforms } = model
    gl.useProgram(programInfo.program)
    setBuffersAndAttributes(gl, programInfo, vertexArrayInfo)
    uniforms && setUniforms(programInfo, uniforms)
    drawBufferInfo(gl, vertexArrayInfo)
  }
}

export const quad: Arrays = {
  position: { size: 2, data: [-1, 1, 1, 1, -1, -1, 1, -1] },
  indices: [0, 1, 2, 2, 1, 3],
}

const mainVert = glsl`  
  vec3 vert();

  void main() {
    gl_Position = vec4(vert(), 1.);
  }
`

const mainFrag = glsl`    
  out vec4 outColor; 
#if USE_ALPHA == 1
  #pragma optional
  vec4 frag();
#else
  #pragma optional
  vec3 frag(); 
#endif  

  void main() {
#if USE_ALPHA == 1   
    outColor = frag();
#else
    outColor = vec4(frag(), 1.);
#endif
  }
`

const globalDefines = { PI: "3.1415926535897932384626433832795" }

function getEntryPointReturnType(module: ShaderModule): string {
  const fragModule = "module" in module ? module.module : module
  const entryName = fragModule.entry
  const declarations = fragModule.table.declarations || []
  const entryDeclaration = declarations.find((d) => d.symbols[0] == entryName) as FunctionRef
  return entryDeclaration.func.type.name
}
