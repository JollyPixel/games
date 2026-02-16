/* eslint-disable no-inline-comments */
// Import Third-party Dependencies
import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";

export class OverlayPass extends Pass {
  #material: THREE.ShaderMaterial;
  #fsQuad: FullScreenQuad;

  constructor(
    color: THREE.ColorRepresentation = 0x000000
  ) {
    super();

    this.#material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        tDiffuse: { value: null as THREE.Texture | null },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 0 }
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform vec3 uColor;
        uniform float uOpacity;

        varying vec2 vUv;

        void main() {
          vec4 base = texture2D(tDiffuse, vUv);
          gl_FragColor = mix(base, vec4(uColor, 1.0), uOpacity);
        }
      `
    });
    this.#fsQuad = new FullScreenQuad(this.#material);
  }

  get uniforms() {
    return this.#material.uniforms;
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ): void {
    this.#material.uniforms.tDiffuse.value = readBuffer.texture;

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

  dispose(): void {
    this.#material.dispose();
    this.#fsQuad.dispose();
  }
}
