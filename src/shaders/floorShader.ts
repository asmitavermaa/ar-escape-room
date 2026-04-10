import * as THREE from 'three';

export const FloorShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x050505) }, // Darker base for better contrast
    uGridColor: { value: new THREE.Color(0x00ffff) },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uGridColor;
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      // Clean grid calculation
      vec2 grid = abs(fract(vUv * 50.0 - 0.5) - 0.5);
      float line = min(grid.x, grid.y);
      float gridLine = smoothstep(0.02, 0.0, line);

      // Fade floor in distance (radial mask)
      float dist = distance(vUv, vec2(0.5));
      float mask = smoothstep(0.5, 0.0, dist);

      // Subtle pulse to show the app is "Alive"
      float pulse = 0.1 + 0.05 * sin(uTime);
      
      vec3 finalColor = mix(uColor, uGridColor, gridLine * 0.3);
      gl_FragColor = vec4(finalColor, mask * pulse);
    }
  `
};