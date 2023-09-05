import { glsl } from "@use-gpu/shader/glsl"

export const attribute = (attribName: string, attribType: string) => glsl`
#ifdef VERT
  #pragma global
  in ${attribType} ${attribName};
  #pragma global
  out ${attribType} v_${attribName};
#elif defined FRAG
  #pragma global
  in ${attribType} v_${attribName};
#endif

  #pragma export
  ${attribType} main() {
#ifdef VERT 
    v_${attribName} = ${attribName};
    return ${attribName};
#elif defined FRAG
    return v_${attribName};
#endif    
  }
`

export const uniform = (attribName: string, attribType: string) => glsl`
  #pragma global
  uniform ${attribType} ${attribName};

  #pragma export
  ${attribType} main() {
    return ${attribName};
  }
`
