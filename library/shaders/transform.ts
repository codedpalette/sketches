import { glsl } from "@use-gpu/shader/glsl"

export const transform2d = glsl`
  #pragma global
  in vec3 position;
  #pragma global
  in mat3 transform;
  #pragma global
  out vec3 v_localPosition;
  #pragma global
  out vec3 v_globalPosition;

  #pragma export
  vec3 main() {    
    mat3 transformMatrix = transform == mat3(0.0) ? mat3(1.0) : transform; //If uninitialized, set identity matrix
    v_localPosition = position;
    
    // Calculate global position without depth, than set it back
    float depth = position.z;
    v_globalPosition = transformMatrix * vec3(position.xy, 1.0);
    v_globalPosition.z = depth;
    
    return v_globalPosition;
  }
`
