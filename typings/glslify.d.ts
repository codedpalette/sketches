declare module "glslify" {
  interface GlslifyOption {
    basedir?: string
    transform?: string[] | [string, unknown][]
  }
  interface Glslify {
    (template: TemplateStringsArray, ...args: any[]): string
    (file: string, option?: GlslifyOption): string
    compile(src: string, option?: GlslifyOption): string
    filename(filename: string, option?: GlslifyOption): string
  }

  const glsl: Glslify
  export default glsl
}
