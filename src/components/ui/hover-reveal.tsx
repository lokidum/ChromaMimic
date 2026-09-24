import * as React from "react";

/**
 * Hover Reveal — a before/after still where the "after" shows through a
 * pool of light that follows the pointer.
 *
 * One WebGL pass over two textures. An fbm noise field gives every pixel its
 * own threshold, so the pool's edge tears into drifting tatters instead of
 * being a clean circle, and the threshold is biased by the luminance of the
 * graded frame so its bright areas burn through first. Leave the frame and
 * the pool shrinks to a small spot that drifts across the image on its own,
 * inviting the next hover. A toggle swells the pool over the whole frame for
 * keyboard and touch users, and the same noise front sweeps it in.
 *
 * Self-contained: raw WebGL1, React is the only import. Without WebGL the
 * after image is masked with a CSS radial gradient that follows the pointer,
 * so the demo still works, it just stops tearing.
 */

export type HoverRevealProps = {
  /** The original frame. */
  before: string;
  /** The graded frame. Same dimensions as `before`. */
  after: string;
  alt?: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Pool radius while hovering, as a share of the box height. */
  radius?: number;
  /** Radius of the spot that drifts about while nobody is pointing. 0 turns it off. */
  idleRadius?: number;
  /** fbm frequency. Higher tears into finer shreds. */
  noiseScale?: number;
  /** Softness of the front, in radius units. */
  edge?: number;
  /** #rrggbb tint of the glow along the front. */
  rim?: string;
  /** CSS aspect-ratio of the box. */
  aspect?: string;
  className?: string;
  /** Overlays: rendered above the frame, below the toggle. */
  children?: React.ReactNode;
};

// #region reveal
export function hexToRgb(hex: string): number[] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [1, 0.85, 0.65];
  const v = parseInt(m[1], 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

/** Frame-rate-independent approach of `from` toward `to`. */
export function follow(from: number, to: number, dt: number, rate: number): number {
  return to + (from - to) * Math.exp(-rate * dt);
}

/** Where the spot drifts when nobody is pointing: a slow Lissajous over the frame. */
export function orbit(t: number): [number, number] {
  return [0.5 + 0.36 * Math.sin(t * 0.31), 0.5 + 0.24 * Math.sin(t * 0.47 + 0.9)];
}

/** Big enough that the noisy front is past every corner of a 3:2 box. */
export const FULL_RADIUS = 3;
// #endregion

const VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform sampler2D u_before;
uniform sampler2D u_after;
uniform vec2 u_res;
uniform float u_imgAspect;
uniform vec2 u_pointer;
uniform float u_radius;
uniform float u_edge;
uniform float u_scale;
uniform float u_time;
uniform vec3 u_rim;

varying vec2 v_uv;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 v) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(v);
    v *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// object-fit: cover, as a UV scale about the centre.
vec2 coverUV(vec2 uv) {
  float ca = u_res.x / u_res.y;
  vec2 s = (ca > u_imgAspect) ? vec2(1.0, u_imgAspect / ca) : vec2(ca / u_imgAspect, 1.0);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  float ca = u_res.x / u_res.y;
  vec2 iuv = coverUV(v_uv);
  vec3 before = texture2D(u_before, iuv).rgb;
  vec3 after = texture2D(u_after, iuv).rgb;

  // Distance from the pointer, in units of the box height.
  vec2 p = (v_uv - u_pointer) * vec2(ca, 1.0);
  float d = length(p);

  // Every pixel gets its own threshold: the noise tears the front, and the
  // graded frame's bright areas cross it first, so the look burns through
  // the highlights before it reaches the shadows.
  float n = fbm(v_uv * vec2(ca, 1.0) * u_scale + vec2(u_time * 0.07, -u_time * 0.04)) * 0.5 + 0.5;
  float lum = dot(after, vec3(0.299, 0.587, 0.114));
  float r = u_radius * (0.7 + 0.5 * n + 0.25 * lum);
  float m = 1.0 - smoothstep(r - u_edge, r + u_edge, d);

  // A thin warm glow along the front: light leaking from the graded side.
  float rim = smoothstep(r - u_edge * 2.0, r, d) * (1.0 - smoothstep(r, r + u_edge * 1.2, d));

  vec3 col = mix(before, after, m);
  col += u_rim * rim * 0.28 * min(u_radius * 4.0, 1.0);
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}
`;

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("could not create shader");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("shader compile failed: " + log);
  }
  return shader;
};

const link = (gl: WebGLRenderingContext, vertSrc: string, fragSrc: string) => {
  const vert = compile(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  if (!program) throw new Error("could not create program");
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("program link failed: " + log);
  }
  return program;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("could not load " + src));
    img.src = src;
  });

const chip =
  "pointer-events-none absolute z-20 rounded-[6px] border border-white/15 bg-black/55 px-2.5 py-1 " +
  "font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur-sm transition-opacity duration-300";

export default function HoverReveal({
  before,
  after,
  alt = "",
  beforeLabel = "Original",
  afterLabel = "Graded",
  radius = 0.34,
  idleRadius = 0.13,
  noiseScale = 2.6,
  edge = 0.06,
  rim = "#E8C9A0",
  aspect = "3 / 2",
  className = "",
  children,
}: HoverRevealProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const afterImgRef = React.useRef<HTMLImageElement | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [generation, setGeneration] = React.useState(0);
  const [full, setFull] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);

  // The loop reads live values through refs, so retuning never rebuilds GL.
  const tuning = React.useRef({ radius, idleRadius, noiseScale, edge, rim: hexToRgb(rim), full });
  tuning.current = { radius, idleRadius, noiseScale, edge, rim: hexToRgb(rim), full };
  const pointer = React.useRef({ x: 0.5, y: 0.5, hovering: false, kick: () => {} });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl =
      canvas.getContext("webgl", { alpha: false, antialias: false }) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) {
      setFailed(true);
      return;
    }

    let disposed = false;
    let raf = 0;
    let last = 0;
    let time = 0;
    let inView = true;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    const textures: (WebGLTexture | null)[] = [null, null];
    let imgAspect = 1.5;
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    // The pool, in the loop rather than in React: it changes every frame.
    const pool = { x: 0.5, y: 0.5, r: 0 };

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onRestored = () => setGeneration((g) => g + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (w === 0 || h === 0 || (canvas.width === w && canvas.height === h)) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    };

    const animating = () => inView && !document.hidden && !reduceMq.matches;

    const draw = () => {
      if (!textures[0] || !textures[1] || !program) return;
      const t = tuning.current;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[0]);
      gl.uniform1i(uniforms.before, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[1]);
      gl.uniform1i(uniforms.after, 1);
      gl.uniform2f(uniforms.res, canvas.width, canvas.height);
      gl.uniform1f(uniforms.imgAspect, imgAspect);
      gl.uniform2f(uniforms.pointer, pool.x, pool.y);
      gl.uniform1f(uniforms.radius, pool.r);
      gl.uniform1f(uniforms.edge, Math.max(t.edge, 0.001));
      gl.uniform1f(uniforms.scale, t.noiseScale);
      gl.uniform1f(uniforms.time, time);
      gl.uniform3f(uniforms.rim, t.rim[0], t.rim[1], t.rim[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const t = tuning.current;
      const pt = pointer.current;
      const reduced = reduceMq.matches;
      if (animating()) time += dt;

      // Where the pool wants to be: under the pointer, everywhere, or drifting.
      const drifting = !pt.hovering && !t.full && t.idleRadius > 0 && !reduced;
      const [tx, ty] = pt.hovering ? [pt.x, pt.y] : drifting ? orbit(time) : [pool.x, pool.y];
      const tr = t.full ? FULL_RADIUS : pt.hovering ? t.radius : drifting ? t.idleRadius : 0;
      const rate = reduced ? 1e3 : pt.hovering ? 10 : 1.4;
      pool.x = follow(pool.x, tx, dt, rate);
      pool.y = follow(pool.y, ty, dt, rate);
      pool.r = follow(pool.r, tr, dt, reduced ? 1e3 : t.full || pt.hovering ? 4.5 : 2.2);
      draw();

      const catching = Math.abs(pool.x - tx) + Math.abs(pool.y - ty) + Math.abs(pool.r - tr) > 0.002;
      const visible = inView && !document.hidden;
      if (visible && (catching || (drifting && animating()))) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (raf || disposed) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    pointer.current.kick = kick;

    const observer = new ResizeObserver(() => {
      resize();
      kick();
    });
    observer.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) kick();
    });
    io.observe(canvas);
    const onVisibility = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", onVisibility);
    reduceMq.addEventListener("change", kick);

    const start = async () => {
      try {
        program = link(gl, VERT, FRAG);
        gl.useProgram(program);
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW,
        );
        const loc = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        for (const name of [
          "before", "after", "res", "imgAspect", "pointer", "radius", "edge", "scale", "time", "rim",
        ]) {
          uniforms[name] = gl.getUniformLocation(program, "u_" + name);
        }
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        const imgs = await Promise.all([loadImage(before), loadImage(after)]);
        if (disposed) return;
        imgs.forEach((img, i) => {
          const tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          // Photos are not powers of two: clamp + linear is the only legal pair in WebGL1.
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          textures[i] = tex;
        });
        imgAspect = imgs[0].naturalWidth / Math.max(imgs[0].naturalHeight, 1);
        resize();
        setReady(true);
        kick();
      } catch {
        // No WebGL, a refused program, or an image that would not upload:
        // show the pictures without the shader rather than nothing.
        if (!disposed) setFailed(true);
      }
    };
    void start();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMq.removeEventListener("change", kick);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      for (const tex of textures) if (tex) gl.deleteTexture(tex);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
  }, [before, after, generation]);

  // Anything that changes the pool's target wakes the loop.
  React.useEffect(() => pointer.current.kick(), [full, hovering, radius, idleRadius]);

  // ---- CSS fallback: the after image masked with a radial gradient -------
  const paintFallback = React.useCallback(
    (x: number, y: number, on: boolean) => {
      const img = afterImgRef.current;
      if (!img) return;
      const r = Math.round(img.clientHeight * radius);
      const mask = `radial-gradient(circle ${r}px at ${x}px ${y}px, black 55%, transparent 100%)`;
      img.style.maskImage = mask;
      img.style.webkitMaskImage = mask;
      img.style.opacity = on ? "1" : "0";
    },
    [radius],
  );

  const setPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const pt = pointer.current;
    pt.x = x / r.width;
    pt.y = 1 - y / r.height;
    pt.hovering = true;
    pt.kick();
    // pointerenter can be missed (a touch that starts inside, a synthetic
    // event), so a move inside the frame counts as hovering too.
    setHovering(true);
    if (failed && !full) paintFallback(x, y, true);
  };
  const onPointerLeave = () => {
    pointer.current.hovering = false;
    pointer.current.kick();
    setHovering(false);
    if (failed && !full) paintFallback(0, 0, false);
  };

  const showAfterChip = hovering || full;

  return (
    <div
      ref={rootRef}
      className={
        "group relative w-full select-none overflow-hidden bg-bg-2 " +
        "[touch-action:pan-y] " +
        className
      }
      style={{ aspectRatio: aspect }}
      onPointerEnter={() => setHovering(true)}
      onPointerMove={setPointer}
      onPointerDown={setPointer}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
    >
      {failed ? (
        <>
          <img
            src={before}
            alt={alt}
            className="absolute inset-0 block h-full w-full object-cover"
            style={{ maxWidth: "none" }}
            draggable={false}
          />
          <img
            ref={afterImgRef}
            src={after}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 block h-full w-full object-cover transition-opacity duration-300"
            style={{ maxWidth: "none", opacity: full ? 1 : 0, maskImage: full ? "none" : undefined }}
            draggable={false}
          />
        </>
      ) : (
        <>
          {/* The before still paints first so nothing is black while textures load. */}
          <img
            src={before}
            alt={alt}
            className="absolute inset-0 block h-full w-full object-cover"
            style={{ maxWidth: "none" }}
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block h-full w-full"
            style={{ opacity: ready ? 1 : 0, transition: "opacity 500ms ease" }}
            aria-hidden="true"
          />
        </>
      )}

      <span className={chip + " left-3 top-3 " + (showAfterChip ? "opacity-50" : "opacity-100")}>
        {beforeLabel}
      </span>
      <span className={chip + " right-3 top-3 " + (showAfterChip ? "opacity-100" : "opacity-0")}>
        {afterLabel}
      </span>

      {children}

      <button
        type="button"
        onClick={() => setFull((f) => !f)}
        aria-pressed={full}
        className={
          "absolute bottom-3 right-3 z-30 inline-flex h-11 items-center gap-2 rounded-[6px] border border-white/15 sm:h-9 " +
          "bg-black/55 px-3 font-mono text-[10.5px] uppercase tracking-wider text-white backdrop-blur-sm " +
          "transition-colors hover:bg-black/75 focus-visible:outline focus-visible:outline-2 " +
          "focus-visible:outline-offset-2 focus-visible:outline-white"
        }
      >
        <span
          className={
            "h-1.5 w-1.5 rounded-full transition-colors " + (full ? "bg-accent" : "bg-white/40")
          }
          aria-hidden="true"
        />
        {full ? "Show " + beforeLabel.toLowerCase() : "Show " + afterLabel.toLowerCase()}
      </button>
    </div>
  );
}
