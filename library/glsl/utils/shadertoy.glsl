precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
#define iResolution u_resolution
#define iTime u_time

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
