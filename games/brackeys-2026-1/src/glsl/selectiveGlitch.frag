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
