declare module "paper.js" {
  const paperCore: Pick<paper.PaperScope, Exclude<keyof paper.PaperScope, "PaperScript">>;
  export = paperCore;
}
