/* ChromaMimic — cinematic hero background shader.
   A quiet, GPU-light dark field: slow domain-warped smoke, a cool→warm
   "colour match" split, fine grain and a vignette. On-theme (chroma being
   graded) without shouting. Caller controls start/stop (visibility +
   prefers-reduced-motion). renderStatic() draws a single still frame. */

const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 frag;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCool;
uniform vec3 uWarm;

// hash + value noise
float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0,0.0)), c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv;
  p.x *= uRes.x / uRes.y;
  float t = uTime * 0.035;

  // domain-warped smoke
  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 4.0));
  float n = fbm(p * 1.6 + q * 1.7 + vec2(0.0, t * 0.6));

  // cool -> warm horizontal blend (the "match")
  float split = smoothstep(0.15, 0.95, uv.x + (n - 0.5) * 0.35);
  vec3 grade = mix(uCool, uWarm, split);

  // luminance shaping: dark base with soft smoky lifts
  float lum = pow(n, 1.7);
  vec3 col = vec3(0.035, 0.035, 0.04);          // near-black base
  col += grade * lum * 0.5;
  col += grade * smoothstep(0.6, 1.0, n) * 0.18; // brighter wisps

  // vignette
  float vig = smoothstep(1.25, 0.35, length(uv - 0.5));
  col *= mix(0.55, 1.0, vig);

  // fine grain
  float g = hash(gl_FragCoord.xy + fract(uTime)) - 0.5;
  col += g * 0.025;

  frag = vec4(max(col, 0.0), 1.0);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
    throw new Error("hero shader compile: " + gl.getShaderInfoLog(sh));
  return sh;
}

export class HeroShader {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private uRes: WebGLUniformLocation | null;
  private uTime: WebGLUniformLocation | null;
  private raf = 0;
  private start0 = 0;
  private last = 0;
  private dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.25);

  static isSupported(): boolean {
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  }

  constructor(
    private canvas: HTMLCanvasElement,
    opts: { cool?: string; warm?: string } = {},
  ) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      throw new Error("hero link: " + gl.getProgramInfoLog(prog));
    this.program = prog;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.uRes = gl.getUniformLocation(prog, "uRes");
    this.uTime = gl.getUniformLocation(prog, "uTime");
    gl.uniform3fv(gl.getUniformLocation(prog, "uCool"), hexToRgb(opts.cool ?? "#3a4a63"));
    gl.uniform3fv(gl.getUniformLocation(prog, "uWarm"), hexToRgb(opts.warm ?? "#7a5a3a"));
    this.resize();
  }

  resize() {
    const { canvas, gl, dpr } = this;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(this.uRes, canvas.width, canvas.height);
  }

  private draw(time: number) {
    this.gl.uniform1f(this.uTime, time);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  renderStatic() {
    this.resize();
    this.draw(8.0); // a pleasant fixed frame
  }

  start() {
    if (this.raf) return;
    const loop = (ts: number) => {
      if (!this.start0) this.start0 = ts;
      const t = (ts - this.start0) / 1000;
      // throttle to ~40fps to stay light
      if (ts - this.last > 24) {
        this.draw(t);
        this.last = ts;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  dispose() {
    this.stop();
    this.gl.deleteProgram(this.program);
  }
}
