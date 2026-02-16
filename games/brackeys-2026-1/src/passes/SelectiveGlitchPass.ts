// Import Third-party Dependencies
import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";

// Import Internal Dependencies
import { generateHeightmap } from "../utils/generateHeightMap.ts";
import vertexShader from "../glsl/selectiveGlitch.vert";
import fragmentShader from "../glsl/selectiveGlitch.frag";

// CONSTANTS
const kSelectiveGlitchShader = {
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
  vertexShader,
  fragmentShader
};
const kDispTextureSize = 64;

export class SelectiveGlitchPass extends Pass {
  #scene: THREE.Scene;
  #camera: THREE.Camera;
  #material: THREE.ShaderMaterial;
  #fsQuad: FullScreenQuad;

  #layerRT = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  });
  #savedLayers = new THREE.Layers();
  #heightMap = generateHeightmap(kDispTextureSize);

  // Glitch timing state
  #curF = 0;
  #randX = THREE.MathUtils.randInt(120, 240);

  goWild = false;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    super();
    this.#scene = scene;
    this.#camera = camera;

    this.#material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(kSelectiveGlitchShader.uniforms),
      vertexShader: kSelectiveGlitchShader.vertexShader,
      fragmentShader: kSelectiveGlitchShader.fragmentShader
    });
    this.#material.uniforms.tDisp.value = this.#heightMap;
    this.#fsQuad = new FullScreenQuad(this.#material);
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ): void {
    this.#savedLayers.mask = this.#camera.layers.mask;
    // Render only layer-1 objects into layerRT (transparent background)
    this.#camera.layers.set(1);

    const oldBackground = this.#scene.background;
    this.#scene.background = null;

    const oldClearColor = renderer.getClearColor(new THREE.Color());
    const oldClearAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);

    renderer.setRenderTarget(this.#layerRT);
    renderer.clear();
    renderer.render(this.#scene, this.#camera);

    // Restore camera layers and scene background
    this.#camera.layers.mask = this.#savedLayers.mask;
    this.#scene.background = oldBackground;
    renderer.setClearColor(oldClearColor, oldClearAlpha);

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
      this.#randX = THREE.MathUtils.randInt(120, 240);
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

  setSize(
    width: number,
    height: number
  ): void {
    this.#layerRT.setSize(width, height);
  }

  dispose(): void {
    this.#layerRT.dispose();
    this.#heightMap.dispose();
    this.#material.dispose();
    this.#fsQuad.dispose();
  }
}
