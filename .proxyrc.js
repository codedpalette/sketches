// Needed for mp4 export
// Also, you have to enable SharedArrayBuffers
// https://subscription.packtpub.com/book/web-development/9781788628174/5/ch05lvl1sec48/enabling-sharedarraybuffers-in-chrome

module.exports = function (app) {
  app.use((_, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });
};
