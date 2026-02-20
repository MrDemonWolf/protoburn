// Vertex shader: reuses same fullscreen quad trick as fire-shaders.ts
export const WALLPAPER_VERTEX_SRC = /* glsl */ `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vUv = vec2(float(gl_VertexID & 1) * 2.0, float((gl_VertexID >> 1) & 1) * 2.0);
  gl_Position = vec4(vUv * 2.0 - 1.0, 0.0, 1.0);
}
`;

// Fragment shader: animated gradient mesh wallpaper
export const WALLPAPER_FRAGMENT_SRC = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_dark; // 0.0 = light mode, 1.0 = dark mode

// --- Simplex 2D noise (same as fire shader) ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 10.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                           + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x_p = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x_p) - 0.5;
  vec3 ox = floor(x_p + 0.5);
  vec3 a0 = x_p - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// FBM with 3 octaves for smooth flowing blobs
float fbm3(vec2 p) {
  float f = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    f += amp * snoise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return f;
}

void main() {
  vec2 uv = vUv;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 coord = vec2(uv.x * aspect, uv.y);

  // Very slow time for subtle movement
  float t = u_time * 0.15;

  // Layered noise at different scales for organic flowing blobs
  float n1 = fbm3(coord * 1.2 + vec2(t * 0.3, t * 0.2));
  float n2 = fbm3(coord * 0.8 + vec2(-t * 0.2, t * 0.15) + vec2(5.3, 1.7));
  float n3 = fbm3(coord * 1.5 + vec2(t * 0.1, -t * 0.25) + vec2(2.1, 8.3));
  float n4 = fbm3(coord * 0.6 + vec2(t * 0.25, t * 0.1) + vec2(9.7, 3.2));

  // Combine noise layers
  float blend = (n1 + n2 + n3 + n4) * 0.25 + 0.5; // normalize to ~0-1
  blend = clamp(blend, 0.0, 1.0);

  // Light mode palette: soft blue, teal, lavender, subtle pink — bright and airy
  vec3 lightC1 = vec3(0.55, 0.82, 0.96); // soft sky blue (#8CD1F5-ish)
  vec3 lightC2 = vec3(0.56, 0.89, 0.85); // teal
  vec3 lightC3 = vec3(0.78, 0.72, 0.93); // lavender
  vec3 lightC4 = vec3(0.94, 0.78, 0.85); // subtle pink
  vec3 lightC5 = vec3(0.88, 0.92, 0.97); // pale blue-white base

  // Dark mode palette: deep navy, purple, teal, dark magenta — rich and moody
  vec3 darkC1 = vec3(0.05, 0.08, 0.22);  // deep navy
  vec3 darkC2 = vec3(0.15, 0.06, 0.28);  // purple
  vec3 darkC3 = vec3(0.04, 0.18, 0.22);  // dark teal
  vec3 darkC4 = vec3(0.22, 0.05, 0.18);  // dark magenta
  vec3 darkC5 = vec3(0.06, 0.06, 0.14);  // deep base

  // Position-based gradients for spatial variation
  float posBlend = uv.y * 0.4 + uv.x * 0.3;

  // Color mixing using noise and position
  float t1 = smoothstep(0.2, 0.5, blend + posBlend * 0.3);
  float t2 = smoothstep(0.3, 0.7, blend - posBlend * 0.2 + n2 * 0.3);
  float t3 = smoothstep(0.1, 0.6, n3 * 0.5 + 0.5);

  // Light mode color
  vec3 lightCol = mix(lightC5, lightC1, t1);
  lightCol = mix(lightCol, lightC2, t2 * 0.5);
  lightCol = mix(lightCol, lightC3, t3 * 0.4);
  lightCol = mix(lightCol, lightC4, smoothstep(0.5, 0.8, n4 * 0.5 + 0.5) * 0.3);

  // Dark mode color
  vec3 darkCol = mix(darkC5, darkC1, t1);
  darkCol = mix(darkCol, darkC2, t2 * 0.6);
  darkCol = mix(darkCol, darkC3, t3 * 0.5);
  darkCol = mix(darkCol, darkC4, smoothstep(0.4, 0.7, n4 * 0.5 + 0.5) * 0.4);

  // Lerp between light and dark palettes
  vec3 color = mix(lightCol, darkCol, u_dark);

  fragColor = vec4(color, 1.0);
}
`;

export interface WallpaperUniforms {
  u_time: WebGLUniformLocation | null;
  u_resolution: WebGLUniformLocation | null;
  u_dark: WebGLUniformLocation | null;
}

export interface WallpaperProgram {
  program: WebGLProgram;
  uniforms: WallpaperUniforms;
  vao: WebGLVertexArrayObject;
}

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}

export function createWallpaperProgram(gl: WebGL2RenderingContext): WallpaperProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, WALLPAPER_VERTEX_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, WALLPAPER_FRAGMENT_SRC);

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${log}`);
  }

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const loc = (name: string) => gl.getUniformLocation(program, name);

  const uniforms: WallpaperUniforms = {
    u_time: loc("u_time"),
    u_resolution: loc("u_resolution"),
    u_dark: loc("u_dark"),
  };

  const vao = gl.createVertexArray()!;

  return { program, uniforms, vao };
}
