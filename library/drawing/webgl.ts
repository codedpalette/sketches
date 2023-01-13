export function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

export function isWebGL2Available() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGL2RenderingContext && canvas.getContext("webgl2"));
  } catch (e) {
    return false;
  }
}

export function getWebGLErrorMessage(canvasWidth: number) {
  return getErrorMessage(1, canvasWidth);
}

export function getWebGL2ErrorMessage(canvasWidth: number) {
  return getErrorMessage(2, canvasWidth);
}

function getErrorMessage(version: 1 | 2, canvasWidth: number) {
  const names = {
    1: "WebGL",
    2: "WebGL 2",
  };

  const contexts = {
    1: window.WebGLRenderingContext,
    2: window.WebGL2RenderingContext,
  };

  let message =
    'Your $0 does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">$1</a>';

  const element = document.createElement("div");
  element.id = "webglmessage";
  element.style.fontFamily = "monospace";
  element.style.fontSize = "18px";
  element.style.fontWeight = "normal";
  element.style.textAlign = "center";
  element.style.background = "#fff";
  element.style.color = "#000";
  element.style.paddingTop = "1.5em";
  element.style.width = `${canvasWidth}px`;

  if (contexts[version]) {
    message = message.replace("$0", "graphics card");
  } else {
    message = message.replace("$0", "browser");
  }

  message = message.replace("$1", names[version]);
  element.innerHTML = message;
  return element;
}
