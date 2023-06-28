// *CREDITS*
// Taken entirely from starter code by Professor Kate Compton.
/////////////////////

// from https://github.com/hughsk/glsl-noise/blob/master/periodic/3d.glsl

let greenFragmentShader = `
#version 330 core
out vec4 FragColor;

void main()
{
    FragColor = vec4(0.0f, 1.0f, 0.0f, 1.0f); // RGBA color; Green
}`

let greyFragShader = `
varying float noise;

void main() {

  vec3 color = vec3(1. - 2. * noise, 1. - 9. * noise, .1 + 4. * noise);
  gl_FragColor = vec4( color.rgb, 1.0 );

}
`

AFRAME.registerShader('displacement-offset', {
  schema: {
    timeMsec: {type:'time', is:'uniform'},
    myOffset: {type:'vec3', is:'uniform'}
  },
  vertexShader: SHADER_NOISE + `

//
// Based on @thespite's article:
// 
// "Vertex displacement with a noise function using GLSL and three.js"
// Source: https://www.clicktorelease.com/blog/vertex-displacement-noise-3d-webgl-glsl-three-js/
//

varying float noise;
uniform float timeMsec; // A-Frame time in milliseconds.
uniform vec3 myOffset;

float turbulence( vec3 p ) {

  float w = 100.0;
  float t = -.5;

  for (float f = 1.0 ; f <= 10.0 ; f++ ){
    float power = pow( 2.0, f );
    t += abs( pnoise3( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
  }

  return t;

}

void main() {
  float time = timeMsec / 1000.0; // Convert from A-Frame milliseconds to typical time in seconds.
  noise = 10.0 *  -.10 * turbulence( .5 * normal + time / 3.0 );
  float b = 5.0 * pnoise3( 0.05 * position, vec3( 100.0 ) );
  float displacement = (- 10. * noise + b) / 50.0;

  vec3 newPosition = position + normal * displacement + myOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
}

`,
  fragmentShader: greyFragShader
});

AFRAME.registerComponent('myoffset-updater', {
  init: function () {
    this.offset = new THREE.Vector3();
  },
  
  tick: function (t, dt) {
    this.offset.copy(this.el.sceneEl.camera.el.getAttribute('position'));
    this.offset.y = 0;
    this.el.setAttribute('material', 'myOffset', this.offset);
  }
});
