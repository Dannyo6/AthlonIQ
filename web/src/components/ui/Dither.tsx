import React, { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";
import "./Dither.css";

export type DitherRgbTuple = [number, number, number];

export interface DitherProps {
  baseColor?: DitherRgbTuple;
  waveColor?: DitherRgbTuple;
  accentColor?: DitherRgbTuple;
  ditherMode?: "bayer" | "noise";
  colorNum?: number;
  pixelSize?: number;
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  mouseEffect?: "reveal" | "repel" | "none";
  mouseRadius?: number;
  mouseStrength?: number;
  enableMouseInteraction?: boolean;
  disableAnimation?: boolean;
  intro?: boolean;
  className?: string;
}

const VERTEX_SHADER_SRC = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intro;
uniform vec3 u_baseColor;
uniform vec3 u_waveColor;
uniform vec3 u_accentColor;
uniform int u_ditherMode;
uniform float u_colorNum;
uniform float u_pixelSize;
uniform float u_waveFrequency;
uniform float u_waveAmplitude;
uniform int u_mouseEffect;
uniform vec2 u_mouse;
uniform float u_mouseActive;
uniform float u_mouseRadius;
uniform float u_mouseStrength;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amp * valueNoise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return value;
}

float bayer8x8(ivec2 pos) {
  int x = pos.x & 7;
  int y = pos.y & 7;
  int idx = (y << 3) + x;
  const int m[64] = int[64](
     0, 32,  8, 40,  2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44,  4, 36, 14, 46,  6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
     3, 35, 11, 43,  1, 33,  9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47,  7, 39, 13, 45,  5, 37,
    63, 31, 55, 23, 61, 29, 53, 21
  );
  return (float(m[idx]) + 0.5) / 64.0;
}

void main() {
  vec2 fragPx = gl_FragCoord.xy;
  vec2 blockCoord = floor(fragPx / max(1.0, u_pixelSize));
  vec2 uv = (blockCoord * max(1.0, u_pixelSize)) / max(u_resolution, vec2(1.0));

  float aspect = u_resolution.x / max(1.0, u_resolution.y);
  vec2 aspectUv = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  vec2 aspectMouse = vec2((u_mouse.x - 0.5) * aspect, u_mouse.y - 0.5);
  float dist = distance(aspectUv, aspectMouse);
  float mouseMask = u_mouseActive * (1.0 - smoothstep(0.0, max(0.01, u_mouseRadius), dist));

  vec2 warpedUv = aspectUv * u_waveFrequency;
  if (u_mouseEffect == 2) {
    vec2 dir = normalize(aspectUv - aspectMouse + vec2(0.0001));
    warpedUv += dir * mouseMask * u_mouseStrength * 0.75;
  }

  float n1 = fbm(warpedUv + vec2(u_time * 0.65, -u_time * 0.35));
  float n2 = fbm(warpedUv + n1 * u_waveAmplitude * 3.0 + vec2(-u_time * 0.4, u_time * 0.55));
  float ridge = smoothstep(0.22, 0.88, n2);

  // Subtle radial falloff keeps the center calm while perimeter waves shimmer
  float centerDist = length(aspectUv);
  float rimLift = smoothstep(0.18, 0.85, centerDist);
  float revealBoost = (u_mouseEffect == 1) ? mouseMask * u_mouseStrength * 0.48 : 0.0;

  float field = clamp(ridge * (0.45 + 0.55 * rimLift) + revealBoost, 0.0, 1.0);

  vec3 col = mix(u_baseColor, u_waveColor, smoothstep(0.12, 0.72, field));
  col = mix(col, u_accentColor, smoothstep(0.66, 1.0, field) * 0.65);

  float threshold = (u_ditherMode == 0)
    ? bayer8x8(ivec2(blockCoord))
    : hash21(blockCoord + fract(u_time));

  float levels = max(2.0, u_colorNum);
  float stepCount = levels - 1.0;
  vec3 dithered = clamp(floor(col * stepCount + threshold) / stepCount, 0.0, 1.0);
  dithered = mix(u_baseColor, dithered, u_intro);

  outColor = vec4(dithered, 1.0);
}`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export const Dither: React.FC<DitherProps> = ({
  baseColor = [0.008, 0.01, 0.015],
  waveColor = [0.14, 0.36, 0.14],
  accentColor = [0.46, 0.68, 0.22],
  ditherMode = "bayer",
  colorNum = 4,
  pixelSize = 2,
  waveSpeed = 0.035,
  waveFrequency = 2.6,
  waveAmplitude = 0.28,
  mouseEffect = "reveal",
  mouseRadius = 0.28,
  mouseStrength = 0.6,
  enableMouseInteraction = true,
  disableAnimation = false,
  intro = true,
  className,
}) => {
  const prefersReduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [supported, setSupported] = useState(true);

  const shouldAnimate = !disableAnimation && !prefersReduced;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl2", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      });
    } catch {
      gl = null;
    }

    if (!gl) {
      setSupported(false);
      return;
    }

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vert || !frag) {
      if (vert) gl.deleteShader(vert);
      if (frag) gl.deleteShader(frag);
      setSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      setSupported(false);
      return;
    }

    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      setSupported(false);
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "a_position");
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const loc = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      intro: gl.getUniformLocation(program, "u_intro"),
      baseColor: gl.getUniformLocation(program, "u_baseColor"),
      waveColor: gl.getUniformLocation(program, "u_waveColor"),
      accentColor: gl.getUniformLocation(program, "u_accentColor"),
      ditherMode: gl.getUniformLocation(program, "u_ditherMode"),
      colorNum: gl.getUniformLocation(program, "u_colorNum"),
      pixelSize: gl.getUniformLocation(program, "u_pixelSize"),
      waveFrequency: gl.getUniformLocation(program, "u_waveFrequency"),
      waveAmplitude: gl.getUniformLocation(program, "u_waveAmplitude"),
      mouseEffect: gl.getUniformLocation(program, "u_mouseEffect"),
      mouse: gl.getUniformLocation(program, "u_mouse"),
      mouseActive: gl.getUniformLocation(program, "u_mouseActive"),
      mouseRadius: gl.getUniformLocation(program, "u_mouseRadius"),
      mouseStrength: gl.getUniformLocation(program, "u_mouseStrength"),
    };

    const mousePos = { x: 0.5, y: 0.5, active: 0 };
    let isVisible = true;
    let isInViewport = true;
    let rafId = 0;
    const startTs = performance.now();

    const resizeCanvas = () => {
      const target = canvasRef.current;
      if (!target || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = target.getBoundingClientRect();
      const width = Math.max(1, Math.floor((rect.width || window.innerWidth) * dpr));
      const height = Math.max(1, Math.floor((rect.height || window.innerHeight) * dpr));
      if (target.width !== width || target.height !== height) {
        target.width = width;
        target.height = height;
      }
      gl.viewport(0, 0, target.width, target.height);
    };

    const drawFrame = (now: number) => {
      if (!gl || !canvasRef.current) return;
      const elapsedSec = (now - startTs) * 0.001;
      const simTime = shouldAnimate ? elapsedSec * waveSpeed * 12.0 : 1.5;
      const introProgress = !shouldAnimate || !intro ? 1.0 : Math.min(1.0, elapsedSec / 0.85);

      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(loc.resolution, canvasRef.current.width, canvasRef.current.height);
      gl.uniform1f(loc.time, simTime);
      gl.uniform1f(loc.intro, introProgress);
      gl.uniform3fv(loc.baseColor, baseColor);
      gl.uniform3fv(loc.waveColor, waveColor);
      gl.uniform3fv(loc.accentColor, accentColor);
      gl.uniform1i(loc.ditherMode, ditherMode === "bayer" ? 0 : 1);
      gl.uniform1f(loc.colorNum, colorNum);
      gl.uniform1f(loc.pixelSize, pixelSize);
      gl.uniform1f(loc.waveFrequency, waveFrequency);
      gl.uniform1f(loc.waveAmplitude, waveAmplitude);
      gl.uniform1i(
        loc.mouseEffect,
        mouseEffect === "reveal" ? 1 : mouseEffect === "repel" ? 2 : 0
      );
      gl.uniform2f(loc.mouse, mousePos.x, mousePos.y);
      gl.uniform1f(loc.mouseActive, enableMouseInteraction ? mousePos.active : 0);
      gl.uniform1f(loc.mouseRadius, mouseRadius);
      gl.uniform1f(loc.mouseStrength, mouseStrength);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const loop = (now: number) => {
      if (!shouldAnimate || !isVisible || !isInViewport) {
        rafId = 0;
        return;
      }
      drawFrame(now);
      rafId = requestAnimationFrame(loop);
    };

    const startOrRenderOnce = () => {
      resizeCanvas();
      if (!shouldAnimate) {
        drawFrame(performance.now());
        return;
      }
      if (!rafId && isVisible && isInViewport) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!enableMouseInteraction || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mousePos.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      mousePos.y = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));
      mousePos.active = 1;
      if (!shouldAnimate) {
        drawFrame(performance.now());
      }
    };

    const handleVisibility = () => {
      isVisible = document.visibilityState !== "hidden";
      if (!isVisible) {
        stopLoop();
      } else {
        startOrRenderOnce();
      }
    };

    const ro = new ResizeObserver(() => {
      resizeCanvas();
      if (!shouldAnimate) {
        drawFrame(performance.now());
      }
    });
    ro.observe(canvas);

    const io = new IntersectionObserver((entries) => {
      isInViewport = entries[0]?.isIntersecting ?? true;
      if (!isInViewport) {
        stopLoop();
      } else {
        startOrRenderOnce();
      }
    });
    io.observe(canvas);

    if (enableMouseInteraction) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibility);

    startOrRenderOnce();

    return () => {
      stopLoop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (gl) {
        if (vao) gl.deleteVertexArray(vao);
        if (buffer) gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vert);
        gl.deleteShader(frag);
      }
    };
  }, [
    baseColor,
    waveColor,
    accentColor,
    ditherMode,
    colorNum,
    pixelSize,
    waveSpeed,
    waveFrequency,
    waveAmplitude,
    mouseEffect,
    mouseRadius,
    mouseStrength,
    enableMouseInteraction,
    shouldAnimate,
    intro,
  ]);

  if (!supported) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("athloniq-dither-canvas", className)}
    />
  );
};
