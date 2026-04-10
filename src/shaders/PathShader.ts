import * as THREE from 'three';

export const PathShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x00ffff) }, // This value is updated by ARScene
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
      // Calculate distance from center
      float dist = distance(vUv, vec2(0.5));
      
      // Pulsing speed (faster for visibility)
      float pulse = 0.7 + 0.3 * sin(uTime * 6.0);
      
      // Ring logic: outer edge at 0.5, inner hole starts at 0.25
      float ring = smoothstep(0.5, 0.4, dist);
      float innerHole = smoothstep(0.2, 0.3, dist);
      
      float alpha = ring * innerHole * pulse;
      
      // Use the uColor passed from the component (Cyan or Red)
      gl_FragColor = vec4(uColor, alpha);
    }
  `
};