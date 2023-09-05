declare module "*.glsl" {
  type ParsedBundle = import("@use-gpu/shader/types").ParsedBundle
  const __module: ParsedBundle
  export default __module
}
