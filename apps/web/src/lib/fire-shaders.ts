// Vertex shader: fullscreen quad via vertex ID trick (no buffer needed)
export const VERTEX_SRC = /* glsl */ `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  // Generates a fullscreen triangle from vertex ID (0,1,2)
  vUv = vec2(float(gl_VertexID & 1) * 2.0, float((gl_VertexID >> 1) & 1) * 2.0);
  gl_Position = vec4(vUv * 2.0 - 1.0, 0.0, 1.0);
}
`;

// Fragment shader: procedural FBM noise fire
export const FRAGMENT_SRC = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

// Fire shape uniforms driven by tier config
uniform float u_bottomHeight;    // 0-1, fraction of screen
uniform float u_bottomIntensity; // 0-1
uniform float u_sideWidth;       // 0-1, fraction of screen
uniform float u_sideIntensity;   // 0-1
uniform float u_sideTop;         // 0-1, how far down the side fire starts (0=top)
uniform float u_topHeight;       // 0-1
uniform float u_topIntensity;    // 0-1
uniform float u_pulseSpeed;      // rad/s for bottom glow pulse
uniform float u_heatShimmer;     // 0 or 1

// Vignette: 0=none, 1=blazing, 2=inferno, 3=meltdown
uniform float u_vignetteType;
uniform float u_vignetteIntensity;

// --- Simplex 2D noise ---
// Adapted from Ashima Arts (MIT license)
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

// FBM: 4 octaves of simplex noise
float fbm(vec2 p) {
  float f = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    f += amp * snoise(p);
    p *= 2.1;
    amp *= 0.5;
  }
  return f;
}

// Fire color ramp: intensity 0..1 -> transparent..white-hot
vec4 fireColor(float intensity) {
  // Ramp: black -> red -> orange -> yellow -> white
  vec3 c1 = vec3(0.1, 0.0, 0.0);  // dark red
  vec3 c2 = vec3(0.9, 0.2, 0.0);  // red-orange
  vec3 c3 = vec3(1.0, 0.6, 0.0);  // orange
  vec3 c4 = vec3(1.0, 0.9, 0.4);  // yellow
  vec3 c5 = vec3(1.0, 1.0, 0.9);  // white-hot

  vec3 col;
  if (intensity < 0.25) col = mix(c1, c2, intensity / 0.25);
  else if (intensity < 0.5) col = mix(c2, c3, (intensity - 0.25) / 0.25);
  else if (intensity < 0.75) col = mix(c3, c4, (intensity - 0.5) / 0.25);
  else col = mix(c4, c5, (intensity - 0.75) / 0.25);

  float alpha = smoothstep(0.0, 0.15, intensity) * intensity;
  return vec4(col, alpha);
}

void main() {
  vec2 uv = vUv;
  // Aspect-corrected coordinates for noise (so fire doesn't stretch)
  float aspect = u_resolution.x / u_resolution.y;

  float totalAlpha = 0.0;
  vec3 totalColor = vec3(0.0);

  // Scrolling noise coordinates (fire moves upward)
  vec2 noiseCoord = vec2(uv.x * aspect * 3.0, uv.y * 3.0 - u_time * 0.8);
  float noise = fbm(noiseCoord);
  // Second noise layer for variation
  float noise2 = fbm(noiseCoord * 1.5 + vec2(5.3, 1.7));
  float combinedNoise = noise * 0.6 + noise2 * 0.4;

  // --- Bottom fire ---
  if (u_bottomHeight > 0.0 && u_bottomIntensity > 0.0) {
    // Distance from bottom edge (0 at bottom, 1 at top)
    float distFromBottom = uv.y;
    // Fire mask: fades from bottom up, shaped by noise
    float fireHeight = u_bottomHeight;
    // Noise makes the top edge of the fire irregular
    float noisyEdge = fireHeight + combinedNoise * fireHeight * 0.5;
    float fireMask = smoothstep(noisyEdge, 0.0, distFromBottom);
    fireMask *= fireMask; // quadratic falloff for more intensity at base

    float pulse = 1.0;
    if (u_pulseSpeed > 0.0) {
      pulse = 0.7 + 0.3 * sin(u_time * u_pulseSpeed);
    }

    float intensity = fireMask * u_bottomIntensity * pulse;
    vec4 fc = fireColor(intensity);
    totalColor += fc.rgb * fc.a;
    totalAlpha = max(totalAlpha, fc.a);
  }

  // --- Side fire (left and right) ---
  if (u_sideWidth > 0.0 && u_sideIntensity > 0.0) {
    float distFromLeft = uv.x;
    float distFromRight = 1.0 - uv.x;
    float sideW = u_sideWidth;

    // Vertical mask: fire only below sideTop
    float vertMask = smoothstep(u_sideTop - 0.1, u_sideTop + 0.1, uv.y);
    // Gets stronger toward bottom
    float vertStrength = mix(0.3, 1.0, smoothstep(u_sideTop, 1.0, uv.y));

    // Noise for side fire uses vertical scrolling
    vec2 sideNoiseCoord = vec2(uv.y * 4.0 - u_time * 0.6, uv.x * 8.0);
    float sideNoise = fbm(sideNoiseCoord) * 0.5 + 0.5;

    // Left side
    float leftEdge = sideW + sideNoise * sideW * 0.6;
    float leftMask = smoothstep(leftEdge, 0.0, distFromLeft) * vertMask * vertStrength;

    // Right side
    float rightEdge = sideW + sideNoise * sideW * 0.6;
    float rightMask = smoothstep(rightEdge, 0.0, distFromRight) * vertMask * vertStrength;

    float sideMask = max(leftMask, rightMask);
    float sideIntensity = sideMask * u_sideIntensity;
    vec4 sc = fireColor(sideIntensity);
    totalColor += sc.rgb * sc.a;
    totalAlpha = max(totalAlpha, sc.a);
  }

  // --- Top glow ---
  if (u_topHeight > 0.0 && u_topIntensity > 0.0) {
    float distFromTop = 1.0 - uv.y;
    float topH = u_topHeight;
    float topNoise = fbm(vec2(uv.x * aspect * 2.0, u_time * 0.3)) * 0.3;
    float topMask = smoothstep(topH + topNoise * topH, 0.0, distFromTop);
    float topIntensity = topMask * u_topIntensity;
    // Top glow uses reddish color
    vec3 topCol = mix(vec3(0.9, 0.15, 0.05), vec3(1.0, 0.5, 0.1), topMask);
    totalColor += topCol * topIntensity;
    totalAlpha = max(totalAlpha, topIntensity);
  }

  // --- Vignette ---
  if (u_vignetteType > 0.5) {
    vec2 center = vec2(0.5);
    float dist = length((uv - center) * vec2(aspect, 1.0));
    float maxDist = length(vec2(aspect * 0.5, 0.5));
    float normDist = dist / maxDist;

    float innerR, vigAlpha;
    vec3 vigColor;

    if (u_vignetteType > 2.5) {
      // Meltdown: fast pulsing red
      float pulse = 0.4 + 0.15 * sin(u_time * (6.2832 / 1.2));
      innerR = 0.3;
      vigAlpha = smoothstep(innerR, 1.0, normDist) * pulse;
      vigColor = vec3(0.94, 0.27, 0.27);
    } else if (u_vignetteType > 1.5) {
      // Inferno: slow pulsing red
      float pulse = 0.12 + 0.06 * sin(u_time * (6.2832 / 3.5));
      innerR = 0.5;
      vigAlpha = smoothstep(innerR, 1.0, normDist) * pulse;
      vigColor = vec3(0.94, 0.27, 0.27);
    } else {
      // Blazing: gentle pulsing orange
      float pulse = 0.06 + 0.04 * sin(u_time * (6.2832 / 5.0));
      innerR = 0.55;
      vigAlpha = smoothstep(innerR, 1.0, normDist) * pulse;
      vigColor = vec3(0.98, 0.45, 0.09);
    }

    totalColor += vigColor * vigAlpha;
    totalAlpha = max(totalAlpha, vigAlpha);
  }

  // --- Heat shimmer (subtle ripple at bottom) ---
  if (u_heatShimmer > 0.5) {
    float shimmerH = 0.15;
    float shimmerMask = smoothstep(shimmerH, 0.0, uv.y);
    float shimmerNoise = snoise(vec2(uv.x * 10.0, u_time * 4.0));
    float shimmerAlpha = shimmerMask * (0.06 + 0.04 * shimmerNoise);
    totalColor += vec3(0.98, 0.45, 0.09) * shimmerAlpha;
    totalAlpha = max(totalAlpha, shimmerAlpha);
  }

  fragColor = vec4(totalColor, totalAlpha);
}
`;

export interface FireUniforms {
  u_time: WebGLUniformLocation | null;
  u_resolution: WebGLUniformLocation | null;
  u_bottomHeight: WebGLUniformLocation | null;
  u_bottomIntensity: WebGLUniformLocation | null;
  u_sideWidth: WebGLUniformLocation | null;
  u_sideIntensity: WebGLUniformLocation | null;
  u_sideTop: WebGLUniformLocation | null;
  u_topHeight: WebGLUniformLocation | null;
  u_topIntensity: WebGLUniformLocation | null;
  u_pulseSpeed: WebGLUniformLocation | null;
  u_heatShimmer: WebGLUniformLocation | null;
  u_vignetteType: WebGLUniformLocation | null;
  u_vignetteIntensity: WebGLUniformLocation | null;
}

export interface FireProgram {
  program: WebGLProgram;
  uniforms: FireUniforms;
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

export function createFireProgram(gl: WebGL2RenderingContext): FireProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${log}`);
  }

  // Clean up individual shaders (linked into program)
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const loc = (name: string) => gl.getUniformLocation(program, name);

  const uniforms: FireUniforms = {
    u_time: loc("u_time"),
    u_resolution: loc("u_resolution"),
    u_bottomHeight: loc("u_bottomHeight"),
    u_bottomIntensity: loc("u_bottomIntensity"),
    u_sideWidth: loc("u_sideWidth"),
    u_sideIntensity: loc("u_sideIntensity"),
    u_sideTop: loc("u_sideTop"),
    u_topHeight: loc("u_topHeight"),
    u_topIntensity: loc("u_topIntensity"),
    u_pulseSpeed: loc("u_pulseSpeed"),
    u_heatShimmer: loc("u_heatShimmer"),
    u_vignetteType: loc("u_vignetteType"),
    u_vignetteIntensity: loc("u_vignetteIntensity"),
  };

  // Empty VAO for the fullscreen triangle (vertex ID trick)
  const vao = gl.createVertexArray()!;

  return { program, uniforms, vao };
}
