/* eslint-disable no-inline-comments */
// Import Third-party Dependencies
import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";

const SelectiveGlitchShader = {
  uniforms: {
    tMain: { value: null as THREE.Texture | null },
    tLayer: { value: null as THREE.Texture | null },
    tDisp: { value: null as THREE.Texture | null },
    byp: { value: 0 },
    amount: { value: 0.08 },
    angle: { value: 0.02 },
    seed: { value: 0.02 },
    seed_x: { value: 0.02 },
    seed_y: { value: 0.02 },
    distortion_x: { value: 0.5 },
    distortion_y: { value: 0.6 },
    col_s: { value: 0.05 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tMain;
    uniform sampler2D tLayer;
    uniform sampler2D tDisp;

    uniform int byp;
    uniform float amount;
    uniform float angle;
    uniform float seed;
    uniform float seed_x;
    uniform float seed_y;
    uniform float distortion_x;
    uniform float distortion_y;
    uniform float col_s;

    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 mainColor = texture2D(tMain, vUv);

      if (byp >= 1) {
        gl_FragColor = mainColor;
        return;
      }

      // Apply glitch UV distortion (based on DigitalGlitch shader)
      vec2 p = vUv;
      float disp = texture2D(tDisp, p * seed * seed).r;

      if (p.y < distortion_x + col_s && p.y > distortion_x - col_s * seed) {
        if (seed_x > 0.0) {
          p.y = 1.0 - (p.y + distortion_y);
        } else {
          p.y = distortion_y;
        }
      }
      if (p.x < distortion_y + col_s && p.x > distortion_y - col_s * seed) {
        if (seed_y > 0.0) {
          p.x = distortion_x;
        } else {
          p.x = 1.0 - (p.x + distortion_x);
        }
      }
      p.x += disp * seed_x * (seed / 5.0);
      p.y += disp * seed_y * (seed / 5.0);

      // RGB shift on the layer texture using distorted UVs
      vec2 offset = amount * vec2(cos(angle), sin(angle));
      vec4 cr = texture2D(tLayer, p + offset);
      vec4 cga = texture2D(tLayer, p);
      vec4 cb = texture2D(tLayer, p - offset);
      vec4 glitched = vec4(cr.r, cga.g, cb.b, max(max(cr.a, cga.a), cb.a));

      // Add noise only where distorted layer content exists
      float xs = floor(gl_FragCoord.x / 0.5);
      float ys = floor(gl_FragCoord.y / 0.5);
      vec4 snow = 200.0 * amount * vec4(rand(vec2(xs * seed, ys * seed * 50.0)) * 0.2);
      glitched += snow * glitched.a;

      // Composite: blend glitched layer over main scene using distorted alpha
      gl_FragColor = mainColor + glitched * glitched.a;
    }
  `
};

// CONSTANTS
const kDispTextureSize = 64;

export class SelectiveGlitchPass extends Pass {
  #scene: THREE.Scene;
  #camera: THREE.Camera;
  #layerRT: THREE.WebGLRenderTarget;
  #material: THREE.ShaderMaterial;
  #fsQuad: FullScreenQuad;
  #savedLayers: THREE.Layers;
  #heightMap: THREE.DataTexture;

  // Glitch timing state
  #curF = 0;
  #randX = 0;

  goWild = false;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    super();

    this.#scene = scene;
    this.#camera = camera;
    this.#savedLayers = new THREE.Layers();

    this.#layerRT = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    this.#heightMap = this.#generateHeightmap(kDispTextureSize);

    this.#material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(SelectiveGlitchShader.uniforms),
      vertexShader: SelectiveGlitchShader.vertexShader,
      fragmentShader: SelectiveGlitchShader.fragmentShader
    });
    this.#material.uniforms.tDisp.value = this.#heightMap;

    this.#fsQuad = new FullScreenQuad(this.#material);

    this.#generateTrigger();
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ): void {
    // 1. Save camera layers state
    this.#savedLayers.mask = this.#camera.layers.mask;

    // 2. Render only layer-1 objects into layerRT (transparent background)
    this.#camera.layers.set(1);

    const oldBackground = this.#scene.background;
    this.#scene.background = null;

    const oldClearColor = renderer.getClearColor(new THREE.Color());
    const oldClearAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);

    renderer.setRenderTarget(this.#layerRT);
    renderer.clear();
    renderer.render(this.#scene, this.#camera);

    // 3. Restore camera layers and scene background
    this.#camera.layers.mask = this.#savedLayers.mask;
    this.#scene.background = oldBackground;
    renderer.setClearColor(oldClearColor, oldClearAlpha);

    // 4. Update glitch uniforms (timing logic from GlitchPass)
    const uniforms = this.#material.uniforms;
    uniforms.tMain.value = readBuffer.texture;
    uniforms.tLayer.value = this.#layerRT.texture;
    uniforms.seed.value = Math.random();
    uniforms.byp.value = 0;

    if (this.#curF % this.#randX === 0 || this.goWild) {
      uniforms.amount.value = Math.random() / 30;
      uniforms.angle.value = THREE.MathUtils.randFloat(-Math.PI, Math.PI);
      uniforms.seed_x.value = THREE.MathUtils.randFloat(-1, 1);
      uniforms.seed_y.value = THREE.MathUtils.randFloat(-1, 1);
      uniforms.distortion_x.value = THREE.MathUtils.randFloat(0, 1);
      uniforms.distortion_y.value = THREE.MathUtils.randFloat(0, 1);
      this.#curF = 0;
      this.#generateTrigger();
    }
    else if (this.#curF % this.#randX < this.#randX / 5) {
      uniforms.amount.value = Math.random() / 90;
      uniforms.angle.value = THREE.MathUtils.randFloat(-Math.PI, Math.PI);
      uniforms.distortion_x.value = THREE.MathUtils.randFloat(0, 1);
      uniforms.distortion_y.value = THREE.MathUtils.randFloat(0, 1);
      uniforms.seed_x.value = THREE.MathUtils.randFloat(-0.3, 0.3);
      uniforms.seed_y.value = THREE.MathUtils.randFloat(-0.3, 0.3);
    }
    else if (!this.goWild) {
      uniforms.byp.value = 1;
    }

    this.#curF++;

    // 5. Composite pass
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    }
    else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) {
        renderer.clear();
      }
    }

    this.#fsQuad.render(renderer);
  }

  setSize(width: number, height: number): void {
    this.#layerRT.setSize(width, height);
  }

  dispose(): void {
    this.#layerRT.dispose();
    this.#heightMap.dispose();
    this.#material.dispose();
    this.#fsQuad.dispose();
  }

  #generateTrigger(): void {
    this.#randX = THREE.MathUtils.randInt(120, 240);
  }

  #generateHeightmap(size: number): THREE.DataTexture {
    const data = new Float32Array(size * size);

    for (let i = 0; i < data.length; i++) {
      data[i] = THREE.MathUtils.randFloat(0, 1);
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.FloatType);
    texture.needsUpdate = true;

    return texture;
  }
}
