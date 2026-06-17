/* ChromaMimic — WebGL2 LUT preview.
   Uploads the generated LUT as a 3D texture and applies it to the source image
   in a fragment shader (hardware trilinear = matches sampleLUT). The compare
   split is computed in-shader. Falls back gracefully: if WebGL2 is missing the
   caller uses the CPU path. Still exports + the scope always use the CPU path. */

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main(){
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp sampler3D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uImage;
uniform highp sampler3D uLut;
uniform float uSize;
uniform float uSplit;
uniform float uHasLut;
void main(){
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec3 src = texture(uImage, uv).rgb;
  vec3 graded = src;
  if (uHasLut > 0.5) {
    vec3 c = clamp(src, 0.0, 1.0);
    vec3 lc = (c * (uSize - 1.0) + 0.5) / uSize;
    graded = texture(uLut, lc).rgb;
  }
  vec3 col = (vUv.x > uSplit) ? graded : src;
  frag = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("shader compile failed: " + log);
  }
  return sh;
}

export class LutPreview {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private imgTex: WebGLTexture;
  private lutTex: WebGLTexture;
  private uSize: WebGLUniformLocation | null;
  private uSplit: WebGLUniformLocation | null;
  private uHasLut: WebGLUniformLocation | null;
  private linearFloat: boolean;
  private size = 33;
  private hasLut = 0;
  private split = 0.5;
  private aspect = 16 / 9;

  static isSupported(): boolean {
    try {
      const c = document.createElement("canvas");
      return !!c.getContext("webgl2");
    } catch {
      return false;
    }
  }

  constructor(private canvas: HTMLCanvasElement) {
    // preserveDrawingBuffer: the preview draws once per change (not in a rAF
    // loop), so the buffer must persist after compositing or it clears to black.
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;
    this.linearFloat = !!gl.getExtension("OES_texture_float_linear");

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error("program link failed: " + gl.getProgramInfoLog(prog));
    }
    this.program = prog;
    gl.useProgram(prog);

    // fullscreen triangle
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.uSize = gl.getUniformLocation(prog, "uSize");
    this.uSplit = gl.getUniformLocation(prog, "uSplit");
    this.uHasLut = gl.getUniformLocation(prog, "uHasLut");
    gl.uniform1i(gl.getUniformLocation(prog, "uImage"), 0);
    gl.uniform1i(gl.getUniformLocation(prog, "uLut"), 1);

    this.imgTex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imgTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.lutTex = gl.createTexture()!;
  }

  setImage(img: HTMLImageElement, maxSide = 1280) {
    const gl = this.gl;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    this.aspect = w / h;
    this.canvas.width = w;
    this.canvas.height = h;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imgTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    this.render();
  }

  setLUT(lut: Float32Array, size: number) {
    const gl = this.gl;
    this.size = size;
    // expand RGB -> RGBA for the 3D texture
    const rgba = new Float32Array(size * size * size * 4);
    for (let i = 0, j = 0; i < lut.length; i += 3, j += 4) {
      rgba[j] = lut[i];
      rgba[j + 1] = lut[i + 1];
      rgba[j + 2] = lut[i + 2];
      rgba[j + 3] = 1;
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this.lutTex);
    const filter = this.linearFloat ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texImage3D(
      gl.TEXTURE_3D,
      0,
      gl.RGBA32F,
      size,
      size,
      size,
      0,
      gl.RGBA,
      gl.FLOAT,
      rgba,
    );
    this.hasLut = 1;
    this.render();
  }

  setSplit(x: number) {
    this.split = Math.max(0, Math.min(1, x));
    this.render();
  }

  getAspect() {
    return this.aspect;
  }

  render() {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imgTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this.lutTex);
    gl.uniform1f(this.uSize, this.size);
    gl.uniform1f(this.uSplit, this.split);
    gl.uniform1f(this.uHasLut, this.hasLut);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteTexture(this.imgTex);
    gl.deleteTexture(this.lutTex);
    gl.deleteProgram(this.program);
  }
}
