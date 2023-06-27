/*global THREE Vue AFRAME */

/*
 * Various helpful utilities - Kate
 */

Vue.component("hsl-colorpicker", {
  template: `<div>
      <input type="color" 
        v-model="hexColor" />
	</div>`,
  computed: {
    hexColor: {
      get: function () {
        return this.color.toHex();
      },
      set: function(hex) {
        this.color.fromHex(hex);
      },
    },
  },
  
  props: {
    "color": {
      required: true,
      type: Object,
    },
  },
});

// Change colors on an object
// Adapted from https://glitch.com/edit/#!/gltf-color-change?path=index.html%3A57%3A13
AFRAME.registerComponent("colorchanger", {
  init: function () {
    this.materialsByID = {};
    let el = this.el;
    // let self = this;
    // self.trees = [];

    el.addEventListener("model-loaded", (e) => {
      // Change all the materials to our material
      let obj3D = el.getObject3D("mesh");
      if (!obj3D) {
        return;
      }

      obj3D.traverse((node) => {
        if (node.isMesh) {
          this.materialsByID[node.name] = node.material;
        }
      });

      console.log(
        "Added material lookup table for submodels:",
        Object.keys(this.materialsByID)
      );

      el.changeColor = (table) => {
        // console.log("ChangeColor")
        Object.keys(table).forEach((key) => {
          // table[key]
          let c = new THREE.Color(table[key]);
          // console.log(this.materialsByID["Node-Mesh"])
          this.materialsByID[key].color = c;
        });
      };
    });
  },
});

// A noise function for shaders
// from https://glitch.com/edit/#!/aframe-displacement-offset-registershader?path=index.html%3A24%3A85
const SHADER_NOISE = `
//
// GLSL textureless classic 3D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-10-11
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise, periodic variant
float pnoise3(vec3 P, vec3 rep)
{
  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

`;

try {
  (function () {
    // The private variables or functions goes here.
    // Add utilities to THREE.js
    THREE.Vector3.prototype.isValid = function () {
      return !(
        this.x === undefined ||
        this.y === undefined ||
        this.z === undefined ||
        isNaN(this.x) ||
        isNaN(this.y) ||
        isNaN(this.z)
      );
    };

    THREE.Vector3.prototype.setFromData = function (v) {
      if (v === undefined) return;
      if (typeof v === "string" || v instanceof String) {
        return this.set(...v.split(" ").map((x) => parseFloat(x)));
      }
      if (Array.isArray(v) && v.length === 3 && typeof v[0] === "number")
        return this.set(...v);
      if (typeof v === "object" && v.x !== undefined) {
        return this.set(v.x, v.y, v.z);
      }

      console.warn("unknown", v, typeof v);
    };

    THREE.Vector3.prototype.addPolar = function ({ r, theta, x, y, z }) {
      let v0 = r * Math.cos(theta);
      let v1 = r * Math.sin(theta);

      // use the x,y or z provided to set the axis
      if (x !== undefined) this.set(this.x + x, this.y + v0, this.z + v1);
      else if (y !== undefined) this.set(this.x + v0, this.y + y, this.z + v1);
      else if (z !== undefined) this.set(this.x + v0, this.y + v1, this.z + z);
      else this.set(this.x + v0, this.y + v1, this.z);
      if (!this.isValid()) {
        console.log(this.x, this.y, this.z);
        // console.log(this.x + v0, this.y + y, this.z + v1)
        console.log(r, theta, v0, v1, y);
      }
      return this;
    };

    THREE.Vector3.prototype.setToPolar = function ({ r, theta, x, y, z }) {
      let v0 = r * Math.cos(theta);
      let v1 = r * Math.sin(theta);

      // use the x,y or z provided to set the axis
      if (x !== undefined) this.set(x, v0, v1);
      else if (y !== undefined) this.set(v0, y, v1);
      else if (z !== undefined) this.set(v0, v1, z);
      else this.set(v0, v1, 0);

      return this;
    };

    THREE.Vector3.prototype.toAFrame = function () {
      return this.toArray()
        .map((v) => v.toFixed(3))
        .join(" ");
    };

    THREE.Vector3.prototype.toHSL = function ({ shade, fade } = {}) {
      let c = shadeColor({ c: this.toArray(), shade, fade });

      return `hsl(${c[0].toFixed(2)}, ${c[1].toFixed(2)}%, ${c[2].toFixed(
        2
      )}%)`;
    };

    THREE.Vector3.prototype.toHex = function ({ shade, fade } = {}) {
      let c = shadeColor({ c: this.toArray(), shade, fade });

      return `hsl(${c[0].toFixed(2)}, ${c[1].toFixed(2)}%, ${c[2].toFixed(
        2
      )}%)`;
    };

    // ChatGPT
    THREE.Vector3.prototype.fromHex = function (H) {
      // Convert hex to RGB first
      let r = 0,
        g = 0,
        b = 0;
      if (H.length == 4) {
        r = "0x" + H[1] + H[1];
        g = "0x" + H[2] + H[2];
        b = "0x" + H[3] + H[3];
      } else if (H.length == 7) {
        r = "0x" + H[1] + H[2];
        g = "0x" + H[3] + H[4];
        b = "0x" + H[5] + H[6];
      }
      // Then to HSL
      r /= 255;
      g /= 255;
      b /= 255;
      let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

      if (delta == 0) h = 0;
      else if (cmax == r) h = ((g - b) / delta) % 6;
      else if (cmax == g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;

      h = Math.round(h * 60);

      if (h < 0) h += 360;

      l = (cmax + cmin) / 2;
      s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
      s = +(s * 100).toFixed(1);
      l = +(l * 100).toFixed(1);

      this.set(h, s, l);
      return this;
    };

    THREE.Vector3.prototype.toHex = function () {
      let h = this.x;
      let s = this.y;
      let l = this.z;

      s /= 100;
      l /= 100;
      let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
        m = l - c / 2,
        r = 0,
        g = 0,
        b = 0;
      if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
      } else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
      } else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
      } else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
      } else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
      } else if (300 <= h && h < 360) {
        r = c;
        g = 0;
        b = x;
      }
      // Having obtained RGB, convert channels to hex
      r = Math.round((r + m) * 255).toString(16);
      g = Math.round((g + m) * 255).toString(16);
      b = Math.round((b + m) * 255).toString(16);

      // Prepend 0s, if necessary
      if (r.length == 1) r = "0" + r;
      if (g.length == 1) g = "0" + g;
      if (b.length == 1) b = "0" + b;

      return "#" + r + g + b;
    };

    function lerp(v0, v1, pct) {
      return v0 * (1 - pct) + v1 * pct;
    }

    // Color stuff
    function shadeColor({ c, shade = 0, fade = 0 }) {
      let targetL = shade > 0 ? 100 : 0;
      let targetS = fade > 0 ? 100 : 0;
      let h = c[0];
      let s = c[1];
      let l = c[2];
      let l2 = lerp(l, targetL, Math.abs(shade));
      let s2 = lerp(s, targetS, Math.abs(fade));
      // Wrap around hue
      h = ((h % 360) + 360) % 360;
      if (c.length == 4) return [h, s, l, c[3]];
      return [h, s2, l2];
    }

    function convertRotationToDirection(rotations) {
      const [xRot, yRot, zRot] = rotations.map((r) => (r * Math.PI) / 180); // convert to radians

      // Rotation matrices
      const rotX = [
        [1, 0, 0],
        [0, Math.cos(xRot), -Math.sin(xRot)],
        [0, Math.sin(xRot), Math.cos(xRot)],
      ];

      const rotY = [
        [Math.cos(yRot), 0, Math.sin(yRot)],
        [0, 1, 0],
        [-Math.sin(yRot), 0, Math.cos(yRot)],
      ];

      const rotZ = [
        [Math.cos(zRot), -Math.sin(zRot), 0],
        [Math.sin(zRot), Math.cos(zRot), 0],
        [0, 0, 1],
      ];

      // Multiply the matrices together
      const rotationMatrix = multiplyMatrices(
        rotZ,
        multiplyMatrices(rotY, rotX)
      );

      // Apply the rotation to the initial direction (assumed to be [0, 0, 1])
      const initialDirection = [0, 0, 1];
      const direction = multiplyMatrixVector(rotationMatrix, initialDirection);

      return direction;
    }

    function multiplyMatrices(a, b) {
      return a.map((row, i) =>
        b[0].map((_, j) =>
          row.reduce((acc, _, n) => acc + a[i][n] * b[n][j], 0)
        )
      );
    }

    function multiplyMatrixVector(matrix, vector) {
      return matrix.map((row) =>
        row.reduce((acc, val, i) => acc + val * vector[i], 0)
      );
    }

    THREE.Vector3.prototype.convert360RotationToDirection = function () {
      let dir = convertRotationToDirection(this.toArray());
      return new THREE.Vector3(...dir);
    };

    return {
      // We return the variables or functions here.
    };
  })();
} catch (err) {
  console.warn(err);
}

//https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

/*
 * A fast javascript implementation of simplex noise by Jonas Wagner

Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
Better rank ordering method by Stefan Gustavson in 2012.

 Copyright (c) 2018 Jonas Wagner

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

(function () {
  "use strict";

  var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  var F3 = 1.0 / 3.0;
  var G3 = 1.0 / 6.0;
  var F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
  var G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

  function SimplexNoise(randomOrSeed) {
    var random;
    if (typeof randomOrSeed == "function") {
      random = randomOrSeed;
    } else if (randomOrSeed) {
      random = alea(randomOrSeed);
    } else {
      random = Math.random;
    }
    this.p = buildPermutationTable(random);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (var i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }
  SimplexNoise.prototype = {
    grad3: new Float32Array([
      1, 1, 0, -1, 1, 0, 1, -1, 0,

      -1, -1, 0, 1, 0, 1, -1, 0, 1,

      1, 0, -1, -1, 0, -1, 0, 1, 1,

      0, -1, 1, 0, 1, -1, 0, -1, -1,
    ]),
    grad4: new Float32Array([
      0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0, -1, 1, 1, 0, -1, 1,
      -1, 0, -1, -1, 1, 0, -1, -1, -1, 1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1,
      0, -1, -1, -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1, 1, 1,
      0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1, -1, 1, 0, 1, -1, 1, 0, -1,
      -1, -1, 0, 1, -1, -1, 0, -1, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1,
      -1, 0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0,
    ]),
    noise2D: function (xin, yin) {
      var permMod12 = this.permMod12;
      var perm = this.perm;
      var grad3 = this.grad3;
      var n0 = 0; // Noise contributions from the three corners
      var n1 = 0;
      var n2 = 0;
      // Skew the input space to determine which simplex cell we're in
      var s = (xin + yin) * F2; // Hairy factor for 2D
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var t = (i + j) * G2;
      var X0 = i - t; // Unskew the cell origin back to (x,y) space
      var Y0 = j - t;
      var x0 = xin - X0; // The x,y distances from the cell origin
      var y0 = yin - Y0;
      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
      if (x0 > y0) {
        i1 = 1;
        j1 = 0;
      } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      else {
        i1 = 0;
        j1 = 1;
      } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
      var y1 = y0 - j1 + G2;
      var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
      var y2 = y0 - 1.0 + 2.0 * G2;
      // Work out the hashed gradient indices of the three simplex corners
      var ii = i & 255;
      var jj = j & 255;
      // Calculate the contribution from the three corners
      var t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) {
        var gi0 = permMod12[ii + perm[jj]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
      }
      var t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) {
        var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
      }
      var t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) {
        var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70.0 * (n0 + n1 + n2);
    },
    // 3D simplex noise
    noise3D: function (xin, yin, zin) {
      var permMod12 = this.permMod12;
      var perm = this.perm;
      var grad3 = this.grad3;
      var n0, n1, n2, n3; // Noise contributions from the four corners
      // Skew the input space to determine which simplex cell we're in
      var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var k = Math.floor(zin + s);
      var t = (i + j + k) * G3;
      var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
      var Y0 = j - t;
      var Z0 = k - t;
      var x0 = xin - X0; // The x,y,z distances from the cell origin
      var y0 = yin - Y0;
      var z0 = zin - Z0;
      // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
      // Determine which simplex we are in.
      var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
      var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
      if (x0 >= y0) {
        if (y0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } // X Y Z order
        else if (x0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } // X Z Y order
        else {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } // Z X Y order
      } else {
        // x0<y0
        if (y0 < z0) {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } // Z Y X order
        else if (x0 < z0) {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } // Y Z X order
        else {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } // Y X Z order
      }
      // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
      // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
      // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
      // c = 1/6.
      var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
      var y1 = y0 - j1 + G3;
      var z1 = z0 - k1 + G3;
      var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
      var y2 = y0 - j2 + 2.0 * G3;
      var z2 = z0 - k2 + 2.0 * G3;
      var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
      var y3 = y0 - 1.0 + 3.0 * G3;
      var z3 = z0 - 1.0 + 3.0 * G3;
      // Work out the hashed gradient indices of the four simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      // Calculate the contribution from the four corners
      var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 < 0) n0 = 0.0;
      else {
        var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
        t0 *= t0;
        n0 =
          t0 *
          t0 *
          (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
      }
      var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 < 0) n1 = 0.0;
      else {
        var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
        t1 *= t1;
        n1 =
          t1 *
          t1 *
          (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
      }
      var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 < 0) n2 = 0.0;
      else {
        var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
        t2 *= t2;
        n2 =
          t2 *
          t2 *
          (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
      }
      var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 < 0) n3 = 0.0;
      else {
        var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
        t3 *= t3;
        n3 =
          t3 *
          t3 *
          (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to stay just inside [-1,1]
      return 32.0 * (n0 + n1 + n2 + n3);
    },
    // 4D simplex noise, better simplex rank ordering method 2012-03-09
    noise4D: function (x, y, z, w) {
      var perm = this.perm;
      var grad4 = this.grad4;

      var n0, n1, n2, n3, n4; // Noise contributions from the five corners
      // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
      var s = (x + y + z + w) * F4; // Factor for 4D skewing
      var i = Math.floor(x + s);
      var j = Math.floor(y + s);
      var k = Math.floor(z + s);
      var l = Math.floor(w + s);
      var t = (i + j + k + l) * G4; // Factor for 4D unskewing
      var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
      var Y0 = j - t;
      var Z0 = k - t;
      var W0 = l - t;
      var x0 = x - X0; // The x,y,z,w distances from the cell origin
      var y0 = y - Y0;
      var z0 = z - Z0;
      var w0 = w - W0;
      // For the 4D case, the simplex is a 4D shape I won't even try to describe.
      // To find out which of the 24 possible simplices we're in, we need to
      // determine the magnitude ordering of x0, y0, z0 and w0.
      // Six pair-wise comparisons are performed between each possible pair
      // of the four coordinates, and the results are used to rank the numbers.
      var rankx = 0;
      var ranky = 0;
      var rankz = 0;
      var rankw = 0;
      if (x0 > y0) rankx++;
      else ranky++;
      if (x0 > z0) rankx++;
      else rankz++;
      if (x0 > w0) rankx++;
      else rankw++;
      if (y0 > z0) ranky++;
      else rankz++;
      if (y0 > w0) ranky++;
      else rankw++;
      if (z0 > w0) rankz++;
      else rankw++;
      var i1, j1, k1, l1; // The integer offsets for the second simplex corner
      var i2, j2, k2, l2; // The integer offsets for the third simplex corner
      var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
      // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
      // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
      // impossible. Only the 24 indices which have non-zero entries make any sense.
      // We use a thresholding to set the coordinates in turn from the largest magnitude.
      // Rank 3 denotes the largest coordinate.
      i1 = rankx >= 3 ? 1 : 0;
      j1 = ranky >= 3 ? 1 : 0;
      k1 = rankz >= 3 ? 1 : 0;
      l1 = rankw >= 3 ? 1 : 0;
      // Rank 2 denotes the second largest coordinate.
      i2 = rankx >= 2 ? 1 : 0;
      j2 = ranky >= 2 ? 1 : 0;
      k2 = rankz >= 2 ? 1 : 0;
      l2 = rankw >= 2 ? 1 : 0;
      // Rank 1 denotes the second smallest coordinate.
      i3 = rankx >= 1 ? 1 : 0;
      j3 = ranky >= 1 ? 1 : 0;
      k3 = rankz >= 1 ? 1 : 0;
      l3 = rankw >= 1 ? 1 : 0;
      // The fifth corner has all coordinate offsets = 1, so no need to compute that.
      var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
      var y1 = y0 - j1 + G4;
      var z1 = z0 - k1 + G4;
      var w1 = w0 - l1 + G4;
      var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
      var y2 = y0 - j2 + 2.0 * G4;
      var z2 = z0 - k2 + 2.0 * G4;
      var w2 = w0 - l2 + 2.0 * G4;
      var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
      var y3 = y0 - j3 + 3.0 * G4;
      var z3 = z0 - k3 + 3.0 * G4;
      var w3 = w0 - l3 + 3.0 * G4;
      var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
      var y4 = y0 - 1.0 + 4.0 * G4;
      var z4 = z0 - 1.0 + 4.0 * G4;
      var w4 = w0 - 1.0 + 4.0 * G4;
      // Work out the hashed gradient indices of the five simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      var ll = l & 255;
      // Calculate the contribution from the five corners
      var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
      if (t0 < 0) n0 = 0.0;
      else {
        var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
        t0 *= t0;
        n0 =
          t0 *
          t0 *
          (grad4[gi0] * x0 +
            grad4[gi0 + 1] * y0 +
            grad4[gi0 + 2] * z0 +
            grad4[gi0 + 3] * w0);
      }
      var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
      if (t1 < 0) n1 = 0.0;
      else {
        var gi1 =
          (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) *
          4;
        t1 *= t1;
        n1 =
          t1 *
          t1 *
          (grad4[gi1] * x1 +
            grad4[gi1 + 1] * y1 +
            grad4[gi1 + 2] * z1 +
            grad4[gi1 + 3] * w1);
      }
      var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
      if (t2 < 0) n2 = 0.0;
      else {
        var gi2 =
          (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) *
          4;
        t2 *= t2;
        n2 =
          t2 *
          t2 *
          (grad4[gi2] * x2 +
            grad4[gi2 + 1] * y2 +
            grad4[gi2 + 2] * z2 +
            grad4[gi2 + 3] * w2);
      }
      var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
      if (t3 < 0) n3 = 0.0;
      else {
        var gi3 =
          (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) *
          4;
        t3 *= t3;
        n3 =
          t3 *
          t3 *
          (grad4[gi3] * x3 +
            grad4[gi3 + 1] * y3 +
            grad4[gi3 + 2] * z3 +
            grad4[gi3 + 3] * w3);
      }
      var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
      if (t4 < 0) n4 = 0.0;
      else {
        var gi4 =
          (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
        t4 *= t4;
        n4 =
          t4 *
          t4 *
          (grad4[gi4] * x4 +
            grad4[gi4 + 1] * y4 +
            grad4[gi4 + 2] * z4 +
            grad4[gi4 + 3] * w4);
      }
      // Sum up and scale the result to cover the range [-1,1]
      return 27.0 * (n0 + n1 + n2 + n3 + n4);
    },
  };

  function buildPermutationTable(random) {
    var i;
    var p = new Uint8Array(256);
    for (i = 0; i < 256; i++) {
      p[i] = i;
    }
    for (i = 0; i < 255; i++) {
      var r = i + ~~(random() * (256 - i));
      var aux = p[i];
      p[i] = p[r];
      p[r] = aux;
    }
    return p;
  }
  SimplexNoise._buildPermutationTable = buildPermutationTable;

  /*
  The ALEA PRNG and masher code used by simplex-noise.js
  is based on code by Johannes Baagøe, modified by Jonas Wagner.
  See alea.md for the full license.
  */
  function alea() {
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    var mash = masher();
    s0 = mash(" ");
    s1 = mash(" ");
    s2 = mash(" ");

    for (var i = 0; i < arguments.length; i++) {
      s0 -= mash(arguments[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(arguments[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(arguments[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;
    return function () {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return (s2 = t - (c = t | 0));
    };
  }
  function masher() {
    var n = 0xefc8249d;
    return function (data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
  }

  // amd
  if (typeof define !== "undefined" && define.amd)
    define(function () {
      return SimplexNoise;
    });
  // common js
  if (typeof exports !== "undefined") exports.SimplexNoise = SimplexNoise;
  // browser
  else if (typeof window !== "undefined") window.SimplexNoise = SimplexNoise;
  // nodejs
  if (typeof module !== "undefined") {
    module.exports = SimplexNoise;
  }
})();

//=======================
// utilities by Kate Compton

let noise = (() => {
  let noiseFxn = new SimplexNoise(0);
  return function noiseAny() {
    if (arguments.length == 1) return noiseFxn.noise2D(arguments[0], 0);
    if (arguments.length == 2)
      return noiseFxn.noise2D(arguments[0], arguments[1]);
    if (arguments.length == 3)
      return noiseFxn.noise3D(arguments[0], arguments[1], arguments[2]);
    if (arguments.length == 4)
      return noiseFxn.noise4D(
        arguments[0],
        arguments[1],
        arguments[2],
        arguments[3]
      );
    return 0;
  };
})();

function forKeyIntersection({ a, b, fxnA, fxnBoth, fxnB }) {
  let keys0 = Object.keys(a);
  let keys1 = Object.keys(b);
  let keysBoth = {};

  for (var i = 0; i < keys0.length; i++) {
    let k = keys0[i];
    if (b.hasOwnProperty(k)) {
      fxnBoth(k, a[k], b[k]);
    } else {
      fxnA(k, a[k]);
    }
  }

  for (var i = 0; i < keys1.length; i++) {
    let k = keys1[i];
    if (a.hasOwnProperty(k)) {
      //fxnBoth(k);
    } else {
      fxnB(k, b[k]);
    }
  }
}

function distanceBetween(v0, v1) {
  return Math.sqrt((v1[0] - v0[0]) ** 2 + (v1[1] - v0[1]) ** 2);
}

function getRandom(arr) {
  return arr[Math.floor(arr.length * Math.random())];
}

//return this.replace(/[^a-z ]/ig, '').replace(/(?:^\w|[A-Z]|\b\w|\s+)/g,..
// With my modifications
function camelize(str) {
  return str
    .replace(/(-|_|\-)/g, " ")
    .replace(/[^\w\s]|_/g, "")
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
      if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

function mapObject(obj, fxn, skipUndefined) {
  let obj2 = {};
  for (var key in obj) {
    let val = fxn(obj[key], key);
    if (val !== undefined || !skipUndefined) obj2[key] = val;
  }
  return obj2;
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

function drawRandom(array, min, max) {
  let count = Math.floor(Math.random() * (max - min) + min);
  if (max === undefined) count = min;

  let arr2 = array.slice(0);
  let arr = shuffleArray(arr2).slice(0, count);
  return arr;
}

// for (var i = 0; i < 3; i++) {
//  let s = `${getRandom(testGrammar.greeting)}, ${getRandom(testGrammar.color)} ${getRandom(testGrammar.animal)}!`
//  if (i == 0)
//    s = "hello, white cat"

//  console.log(s)
//  console.log(detectGrammarMatch(testGrammar, `#color# #animal#`, s))
//  console.log(detectGrammarMatch(testGrammar, `#greeting#.*#animal#`, s))
// }

function detectGrammarMatch(grammar, rule, s) {
  let rx = ruleToRegex(rule, grammar);
  let match = s.match(new RegExp(rx, "i"));
  return match;
}

function ruleToRegex(rule, grammar) {
  let sections = rule.split("#");
  return sections
    .map((s, sindex) => {
      if (sindex % 2 == 0) {
        // Plaintext
        return s;
      } else {
        let rules = grammar[s];
        return `(${rules.join("|")})`;
      }
    })
    .join("");
}

let words = {
  rng: Math.random,
  getRandom(arr) {
    return arr[Math.floor(arr.length * this.rng())];
  },

  handEmoji:
    "🤲 👐 🙌 👏 🤝 👍 👎 👊 ✊ 🤛 🤜 🤞 ✌️ 🤟 🤘 👌 🤏 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐 🖖 🤙 💪 🖕 ✍️ 🙏 💅 🤝 🤗 🙋‍♀️ 🙆‍♂️ 🤦‍♂️".split(
      " "
    ),
  emoji:
    "😎 🤓 😍 😀 😭 😡 😳 😱 😈 😺 👎 👍 🎃 🤖 👻 ☠️ 👽 👾 🤠 ✍️ 👀 🧠 👩‍🚀 🧝‍♀️ 🦹‍♂️ 🧙‍♀️ 👸 👩‍💻 🕵️‍♀️ 🧶 🧵 👗 🥼 👕 👘 👖 👠 👞 🧤 🧦 🧢 🎩 👑 💍 👓 🕶 🥽 🐶 🐱 🐭 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐣 🦆 🦅 🦉 🦇 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🦟 🐢 🐍 🕷 🦂 🐍 🦎 🦖 🐙 🦑 🦞 🦀 🐋 🦈 🐟 🐬 🐡 🐊 🐅 🐆 🦓 🦍 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🐈 🐓 🦃 🦚 🦜 🦢 🐇 🦝 🦡 🐁 🐀 🐿 🦔 🐾 🐉 🌵 🎄 🌲 🌳 🌴 🌱 🌿 ☘️ 🍃 🍂 🍁 🍄 🐚 🌾 🌷 🥀 🌺 🌹 🌸 🌼 🌻 🌞 🌛 ⭐️ 💫 🌟 ✨ ⚡️ ☄️ 💥 🔥 🌪 🌈 ☀️ ☁️ 🌧 🌩 ❄️ ☃️ 💨 💧 💦 ☂️".split(
      " "
    ),

  syllables: {
    first:
      "M N K R L P S T B P T T T N M M M B C D F G Ph J K L M N P Qu R S T V W X Y Z St Fl Bl Pr Kr Ll Chr Sk Br Sth Ch Dhr Dr Sl Sc Sh Thl Thr Pl Fr Phr Phl Wh"
        .split(" ")
        .map((s) => s.toLowerCase()),
    middle:
      "an un in ikl op up an on een a e ie as att it ot out ill all ar ir er od ed ack ock ax ox off is it in im am om all aff en em aw an ad in an on ion ill oop ack ist all ar art air aean eun eun euh esqu aphn arl ifn ast ign agn af av ant app ab er en eor eon ent enth iar ein irt ian ion iont ill il ipp in is it ik ob ov orb oon ion uk uf un ull urk".split(
        " "
      ),
    composites: "estr antr okl ackl".split(" "),
    last: "ant ent art ert e a i ie ei a a ae ea e e ea a ae ea e e ea a ae ea e e e y yay oy y a ia ea u y as en am us is art on in ath oll an o ang ing io i el ios ius ae ie ee i".split(
      " "
    ),
    lastVerb: "ade ay ate ify ize ant ise y aze ise int ard ord ip".split(" "),
  },
  title: [
    "the #placeAdj# #place#",
    "#firstName#'s #adventure#",
    "#place# of #stuff#",
    "#occupation# and the #occupation#",
  ],
  wordSets: [
    "occupation",
    "flavor",
    "musicGenre",
    "instrument",
    "color",
    "material",
    "adventure",
    "firstName",
    "lastName",
    "object",
    "objAdj",
    "action",
    "placeAdj",
    "place",
    "stuff",
    "animal",
    "mood",
  ],
  instrument: [
    "ukulele",
    "vocals",
    "guitar",
    "clarinet",
    "piano",
    "harmonica",
    "sitar",
    "tabla",
    "harp",
    "dulcimer",
    "violin",
    "accordion",
    "concertina",
    "fiddle",
    "tamborine",
    "bagpipe",
    "harpsichord",
    "euphonium",
  ],
  musicGenre: [
    "metal",
    "electofunk",
    "jazz",
    "salsa",
    "klezmer",
    "zydeco",
    "blues",
    "mariachi",
    "flamenco",
    "pop",
    "rap",
    "soul",
    "gospel",
    "buegrass",
    "swing",
    "folk",
  ],
  occupation: [
    "professor",
    "inventor",
    "spy",
    "chef",
    "hacker",
    "artist",
    "sculptor",
    "insurance salesman",
    "fashion designer",
    "web developer",
    "game programmer",
    "lumberjack",
    "firefighter",
    "scientist",
    "spy",
    "wizard",
    "radio broadcaster",
    "smuggler",
    "mechanic",
    "astronaut",
    "adventurer",
    "pirate",
    "cowboy",
    "vampire",
    "detective",
    "soldier",
    "marine",
    "doctor",
    "ninja",
    "waitress",
    "burlesque dancer",
    "ballerina",
    "opera singer",
    "gogo dancer",
    "rollerskater",
  ],
  flavor: [
    "special",
    "dark",
    "light",
    "bitter",
    "burnt",
    "savory",
    "flavorful",
    "aromatic",
    "fermented",
    "herbal",
    "pleasant",
    "harsh",
    "smoky",
    "sweet",
    "fresh",
    "refreshing",
    "somber",
    "bright",
    "perky",
    "sullen",
    "acidic",
    "sour",
    "peaty",
    "juicy",
    "perfumed",
    "buttery",
    "lush",
    "brisk",
    "strong",
    "weak",
    "tart",
    "tangy",
    "bold",
    "overpowering",
    "light",
    "faint",
    "subtle",
    "bright",
    "zesty",
    "austere",
    "round",
    "big",
    "buttery",
    "oaky",
    "peaty",
    "seedy",
    "gritty",
    "creamy",
    "smooth",
    "rustic",
    "complex",
    "chewy",
    "sweet",
    "crisp",
    "dense",
    "bold",
    "elegant",
    "sassy",
    "opulent",
    "massive",
    "wide",
    "flamboyant",
    "fleshy",
    "approachable",
    "jammy",
    "juicy",
    "refined",
    "silky",
    "structured",
    "steely",
    "rich",
    "toasty",
    "burnt",
    "velvety",
    "unctuous",
    "oily",
  ],
  firstName: [
    "Steve",
    "Michael",
    "Michaela",
    "Bob",
    "Chloe",
    "Zora",
    "Nikki",
    "Nia",
    "Sal",
    "Greta",
    "Zola",
    "Miki",
    "Kendra",
    "Kyle",
    "Mike",
    "Rob",
    "April",
    "Gregory",
    "Nathaniel",
    "Jim",
    "Arnav",
    "Noah",
    "Daniel",
    "David",
    "Cindy",
    "Stella",
    "Jonathan",
    "Gabriel",
    "Lucia",
    "Hollis",
    "Holly",
    "Maisie",
    "Jasper",
    "Lane",
    "Lincoln",
    "Sterling",
    "Summer",
    "Miranda",
    "Maria",
    "Shane",
    "Min",
    "Minnie",
    "Mariah",
    "Gus",
    "Dani",
    "Darius",
    "Elena",
    "Eduardo",
    "Elías",
    "Rajesh",
    "Ranjit",
    "Rex",
    "Rez",
    "Rey",
    "Yew",
    "Reba",
    "Jae-woo",
    "Ken",
    "Kira",
    "Jae",
    "Shah",
    "Josef",
    "Jørn",
    "Autumn",
    "Brandy",
    "Copper",
    "Cooper",
    "Harrow",
    "Manhattan",
    "Jo",
    "Jodi",
    "Karim",
    "Raf",
    "January",
    "Aku",
    "Juraj",
    "Yuri",
    "Kåre",
    "Lyn",
    "Jahan",
    "Mitch",
    "Alda",
    "Aimee",
    "Zoe",
    "London",
    "Paris",
    "Zuzu",
    "Zara",
    "Micah",
    "Song",
    "Sparrow",
    "Miguel",
    "Mikey",
    "Monette",
    "Michelina",
    "Agave",
    "Robyn",
    "Saffron",
    "Zeke",
    "Garth",
    "Rae",
    "Sebastian",
    "Seb",
    "Jake",
    "Bastion",
    "Luna",
    "Apple",
    "Delilah",
    "Jeremiah",
    "Finn",
    "Milo",
    "Finley",
    "April",
    "May",
    "September",
    "Kim",
    "Phineas",
    "Quincy",
    "Saul",
    "Rudy",
    "Cleo",
    "Noel",
    "Frankie",
    "June",
    "Rocky",
    "Pearl",
    "Harris",
    "Braxton",
    "Hamilton",
    "Ace",
    "Duke",
    "Rowan",
    "Stella",
    "Stevie",
    "Juniper",
    "Ryder",
    "Kai",
    "Judd",
    "Rhody",
    "Rho",
    "Sven",
    "Hazel",
    "Byron",
    "Edie",
    "Lola",
    "Poppy",
    "Jo",
    "Whisper",
    "Kaya",
    "Karim",
    "Kit",
    "Luca",
    "Rafa",
    "Miriam",
    "Aya",
    "Carmen",
    "Omar",
    "Anika",
    "Shan",
    "Luka",
    "Theo",
    "Emma",
    "Julian",
    "Adrian",
    "Ari",
    "Noah",
    "Maya",
    "Ariel",
  ],
  lastName: [
    "Stevens",
    "Chao",
    "Fillmore",
    "García",
    "Bond",
    "Bogg",
    "Wong",
    "Wei",
    "Goldsmith",
    "Tran",
    "Chu",
    "Baudin",
    "Montagne",
    "Moulin",
    "Villeneuve",
    "Victor",
    "Rodríguez",
    "Smith",
    "Johnson",
    "Williams",
    "Miller",
    "Stockton",
    "Patel",
    "Chaudri",
    "Jahan",
    "Christiansen",
    "Whittington",
    "Austen",
    "Johnson",
    "Cheval",
    "McCulloch",
    "Shane",
    "Jones",
    "Stein",
    "Hirviniemi",
    "Kiuru",
    "Øvregard",
    "Singh",
    "Noriega",
    "Pine",
    "Clarion",
    "Belden",
    "Jaware",
    "Keita",
    "Kanu",
    "Geary",
    "Norton",
    "Kearny",
    "Aliyev",
    "Sato",
    "Tanaka",
    "Kim",
    "Lee",
    "Gray",
    "Yang",
    "Li",
    "Çelik",
    "Davis",
    "Knox",
    "Griffin",
    "Leon",
    "Finch",
    "Yoo",
    "Gupta",
    "Flores",
    "Lopez",
    "Moon",
    "Sun",
    "Castro",
    "Suzuki",
    "Torres",
    "Pineda",
    "Tsao",
    "Romero",
    "Wolf",
  ],
  object: [
    "kettle",
    "table",
    "chair",
    "desk",
    "lamp",
    "vase",
    "urn",
    "candelabra",
    "lantern",
    "idol",
    "orb",
    "book",
    "basket",
    "hammer",
    "flowerpot",
    "bicycle",
    "paintbrush",
    "goblet",
    "bottle",
    "jar",
    "toaster",
    "teacup",
    "teapot",
    "rug",
    "basket",
    "thimble",
    "ottoman",
    "cushion",
    "pen",
    "pencil",
    "mug",
    "egg",
    "chair",
    "sun",
    "cloud",
    "bell",
    "bucket",
    "lemon",
    "glove",
    "moon",
    "star",
    "seed",
    "card",
    "pancake",
    "waffle",
    "car",
    "train",
    "spoon",
    "fork",
    "potato",
  ],
  objAdj: [
    "wooden",
    "old",
    "vintage",
    "woven",
    "antique",
    "broken",
    "tiny",
    "giant",
    "little",
    "upside-down",
    "dented",
    "imaginary",
    "glowing",
    "curséd",
    "glittery",
    "organic",
    "rusty",
    "multi-layered",
    "complicated",
    "ornate",
    "dusty",
    "gleaming",
    "fresh",
    "ancient",
    "forbidden",
    "milky",
    "upholstered",
    "comfortable",
    "dynamic",
    "solar-powered",
    "coal-fired",
    "warm",
    "cold",
    "frozen",
    "melted",
    "boxy",
    "well-polished",
    "vivid",
    "painted",
    "embroidered",
    "enhanced",
    "embellished",
    "collapsible",
    "simple",
    "demure",
  ],
  action: [
    "sing",
    "become",
    "come",
    "leave",
    "remain",
    "see",
    "look",
    "behold",
    "cry",
    "sleep",
    "love",
    "dance",
    "betray",
    "need",
  ],
  preposition: [
    "for",
    "until",
    "before",
    "up",
    "on",
    "above",
    "below",
    "against",
    "upon",
    "inside",
    "outside",
    "in",
  ],

  article: [
    "any",
    "no",
    "one",
    "her",
    "his",
    "our",
    "my",
    "your",
    "the",
    "every",
  ],
  placeAdj: [
    "great",
    "tiny",
    "biggest",
    "oldest",
    "worst",
    "best",
    "windy",
    "wasted",
    "drunken",
    "gleaming",
    "knowing",
    "beloved",
    "all-seeing",
    "forgiving",
    "betraying",
    "forgotten",
    "western",
    "eastern",
    "starlit",
    "forgotten",
    "lost",
    "haunted",
    "blessed",
    "remembered",
    "forsaken",
    "unknowing",
    "innocent",
    "short-lived",
    "loving",
    "rejoicing",
    "fearful",
    "experienced",
    "vengeful",
    "forgiving",
    "joyful",
    "mournful",
    "sorrowful",
    "angry",
    "cruel",
    "fierce",
    "unbent",
    "broken",
    "unbroken",
    "foolish",
    "bewildered",
    "curious",
    "knowing",
    "everliving",
    "everloving",
    "hard-hearted",
    "careless",
    "carefree",
    "bright",
    "dangerous",
    "fearless",
    "open-hearted",
    "generous",
    "prideful",
    "foolhardy",
    "brave",
    "bold",
    "wise",
    "wizened",
    "old",
    "young",
  ],
  place: [
    "room",
    "sea",
    "room",
    "forest",
    "pagoda",
    "waste",
    "temple",
    "sanctuary",
    "ocean",
    "wall",
    "parlor",
    "hall",
    "dungeon",
    "cave",
    "sky",
    "house",
    "mountain",
    "sanctum",
    "palace",
    "river",
    "place",
    "desert",
    "island",
    "castle",
    "house",
    "inn",
    "tavern",
    "tower",
    "oasis",
    "tent",
  ],
  stuff: [
    "stone",
    "sorrow",
    "eyes",
    "flowers",
    "time",
    "fog",
    "sun",
    "clouds",
    "music",
    "songs",
    "stories",
    "tales",
    "storms",
    "rhyme",
    "freedom",
    "rhythm",
    "wind",
    "life",
    "ice",
    "gold",
    "mysteries",
    "song",
    "waves",
    "dreams",
    "water",
    "steel",
    "iron",
    "memories",
    "thought",
    "seduction",
    "remembrance",
    "loss",
    "fear",
    "joy",
    "regret",
    "love",
    "friendship",
    "sleep",
    "slumber",
    "mirth",
  ],
  animal:
    "cobra okapi moose amoeba mongoose capybara yeti dragon unicorn sphinx kangaroo boa nematode sheep quail goat corgi agouti zebra giraffe rhino skunk dolphin whale bullfrog okapi sloth monkey orangutan grizzly moose elk dikdik ibis stork finch nightingale goose robin eagle hawk iguana tortoise panther lion tiger gnu reindeer raccoon opossum".split(
      " "
    ),
  mood: "vexed indignant impassioned wistful astute courteous benevolent convivial mirthful lighthearted affectionate mournful inquisitive quizzical studious disillusioned angry bemused oblivious sophisticated elated skeptical morose gleeful curious sleepy hopeful ashamed alert energetic exhausted giddy grateful groggy grumpy irate jealous jubilant lethargic sated lonely relaxed restless surprised tired thankful".split(
    " "
  ),
  color:
    "ivory silver ecru scarlet red burgundy ruby crimson carnelian pink rose grey pewter charcoal slate onyx black mahogany brown green emerald blue sapphire turquoise aquamarine teal gold yellow carnation orange lavender purple magenta lilac ebony amethyst jade garnet".split(
      " "
    ),
  material:
    "fire water cybernetic steampunk jazz steel bronze brass leather pearl cloud sky great crystal rainbow iron gold silver titanium".split(
      " "
    ),
  adventure:
    "lament cry wail tale myth story epic tears wish desire dance mystery enigma drama path training sorrows joy tragedy comedy riddle puzzle regret victory loss song adventure question quest vow oath tale travels".split(
      " "
    ),
  witchName: "Gertrude Baba Hildebrand Ingrid Morgana Morraine".split(" "),

  capitaliseFirstLetter: function (s) {
    return s[0].toUpperCase() + s.substring(1);
  },

  getRandomCode: function () {
    let code =
      this.getRandom(this.colors) +
      " " +
      this.getRandom(this.material) +
      " " +
      this.getRandom(this.object);
    return code;
  },

  getRandomSentence: function (count) {
    count = count || Math.floor(this.rng() * 10 + 1);
    let srcs = [
      "firstName",
      "lastName",
      "mood",
      "color",
      "material",
      "objAdj",
      "object",
      "place",
      "stuff",
      "adventure",
      "animal",
      "placeAdj",
    ];
    let words = [];
    for (var i = 0; i < count; i++) {
      let src = this[this.getRandom(srcs)];
      let word = this.getRandom(src);
      words.push(word);
    }

    return this.capitaliseFirstLetter(words.join(" ")) + ".";
  },
  getRandomParagraph: function (count = 8) {
    let s = [];
    for (var i = 0; i < count; i++) {
      s.push(this.getRandomSentence());
    }
    return s.join(" ");
  },
  getRandomSeed: function (count = 8) {
    let s = "";
    for (var i = 0; i < count; i++) {
      if (this.rng() > 0.5) {
        s += String.fromCharCode(Math.floor(this.rng() * 26 + 65));
      } else {
        s += String.fromCharCode(Math.floor(this.rng() * 10 + 48));
      }
    }
    return s;
  },

  getHumanName: function () {
    let s = this.getRandom(this.firstName);
    s += " " + this.getRandom(this.lastName);
    if (this.rng() > 0.8) {
      return (
        this.capitaliseFirstLetter(this.getRandom(this.animal)) +
        " " +
        this.getRandom(this.lastName)
      );
    }
    if (this.rng() > 0.8) {
      return (
        this.capitaliseFirstLetter(this.getRandom(this.animal)) +
        " " +
        this.getRandom(this.firstName)
      );
    }
    if (this.rng() > 0.8) {
      return this.getRandom(this.firstName) + Math.floor(this.rng() * 2000);
    }
    return s;
  },
  getObject: function () {
    let s = this.getRandom(this.object);

    if (this.rng() > 0.9) {
      return s + " of " + this.getRandom(this.stuff);
    }
    if (this.rng() > 0.3) {
      let adj = this.getRandom([
        "color",
        "material",
        "placeAdj",
        "mood",
        "objAdj",
        "objAdj",
      ]);
      return this.getRandom(this[adj]) + " " + s;
    }

    return s;
  },

  getUserName: function () {
    let sections = [];
    let count = Math.floor(this.rng() ** 2 * 3 + 1);
    for (var i = 0; i < count; i++) {
      let s = this.getRandomWord(this.rng() ** 2 * 3);
      if (this.rng() > 0.4) {
        let set = words.getRandom([
          "object",
          "objAdj",
          "firstName",
          "lastName",
          "animal",
          "mood",
          "color",
          "material",
          "adventure",
          "place",
          "stuff",
        ]);
        if (!this[set]) console.warn(set);
        s = this.getRandom(this[set]);
      }
      s = s.toLowerCase();
      if (this.rng() > 0.8) s = this.capitaliseFirstLetter(s);

      sections[i] = s;
    }

    let s = sections.join("");
    if (s.length < 10 && this.rng() > 0.5) s += Math.floor(this.rng() * 2000);
    if (s.length < 6) s += this.getRandomWord(1).toUpperCase();
    s = s.substring(0, 15);
    if (s.length < 8) s += Math.floor(this.rng() ** 2 * 2000);
    return s;
  },

  getStatement: function () {
    return (
      "This " +
      this.getRandom(this.moods) +
      " " +
      this.getRandom(this.adventures) +
      " made me " +
      this.getRandom(this.moods)
    );
  },

  getRandomTimestamp: function (startTime, timeFromNow) {
    let date = new Date(startTime + this.rng() * timeFromNow);

    return date.toLocaleString();
  },

  getRandomPlace: function () {
    let adj = this.capitaliseFirstLetter(this.getRandom(this.adj));
    let adv = this.capitaliseFirstLetter(this.getRandom(this.adventure));
    let animal = this.capitaliseFirstLetter(this.getRandom(this.animal));
    let stuff = this.capitaliseFirstLetter(this.getRandom(this.stuff));
    let place = this.capitaliseFirstLetter(this.getRandom(this.place));
    let material = this.capitaliseFirstLetter(this.getRandom(this.material));

    if (Math.random() > 0.4)
      material = this.capitaliseFirstLetter(this.getRandom(this.colors));

    let fxns = [
      () => material + " " + place,
      () => place + " of " + adj + " " + stuff,
      () => adj + " " + place,
      () => "The " + material + " " + place,
      () => place + " of " + stuff,
    ];

    return this.getRandom(fxns)();
  },

  getRandomTitle: function () {
    let adv = this.capitaliseFirstLetter(this.getRandom(this.adventure));
    let animal = this.capitaliseFirstLetter(this.getRandom(this.animal));
    let stuff = this.capitaliseFirstLetter(this.getRandom(this.stuff));
    let place = this.capitaliseFirstLetter(this.getRandom(this.place));
    let material = this.capitaliseFirstLetter(this.getRandom(this.material));
    var adj = this.getRandom(this.mood);
    if (this.rng() > 0.5) adj = this.getRandom(this.color);
    if (this.rng() > 0.4) adv = place;
    adj = this.capitaliseFirstLetter(adj);

    if (this.rng() < 0.3) {
      let prefix2 = "";
      if (this.rng() > 0.5) prefix2 += "The ";
      if (this.rng() > 0.5)
        prefix2 +=
          this.capitaliseFirstLetter(this.getRandom(this.placeAdj)) + " ";
      return (
        prefix2 +
        `${this.capitaliseFirstLetter(material)} ${this.capitaliseFirstLetter(
          this.getRandom(this.object)
        )}`
      );
    }

    var thing = this.getRandom(this.place);
    if (this.rng() > 0.5) thing = this.getRandom(this.animal);
    if (this.rng() > 0.5) thing = this.getRandom(this.adventure);
    if (this.rng() > 0.4) thing = this.getRandom(this.object);
    thing = this.capitaliseFirstLetter(thing);

    let prefix = "";
    if (this.rng() > 0.4) {
      prefix = this.capitaliseFirstLetter(
        this.getRandom([
          this.getRandomWord(1) + "'s",
          this.getRandomWord(0.5) + "'s",
          this.getRandomWord(0.5) + "'s",
          "a",
          "every",
          "any",
          "that",
          "my",
          "our",
          "his",
          "her",
          "some",
          "the",
          "a",
          "last",
          "no",
        ])
      );
      prefix += " ";
    }

    let prefix2 = "";
    if (this.rng() > 0.4) {
      prefix2 = this.capitaliseFirstLetter(
        this.getRandom([
          this.getRandomWord(1) + "'s",
          this.getRandomWord(0.5) + "'s",
          this.getRandomWord(0.5) + "'s",
          "a",
          "every",
          "any",
          "that",
          "my",
          "our",
          "his",
          "her",
          "some",
          "the",
          "a",
          "last",
          "no",
        ])
      );
      prefix2 += " ";
    }

    let word = this.capitaliseFirstLetter(this.getRandomWord(0.5));

    if (this.rng() > 0.94) return "The " + adj + " " + adv;
    if (this.rng() > 0.9) return prefix + adj + " " + place;

    if (this.rng() > 0.9) {
      return (
        this.capitaliseFirstLetter(this.getRandom(this.preposition)) +
        " " +
        this.getRandom(this.article) +
        " " +
        adj +
        " " +
        thing
      );
    }
    if (this.rng() > 0.8) {
      return this.capitaliseFirstLetter(adj + " " + thing);
    }
    if (this.rng() > 0.8) {
      return this.capitaliseFirstLetter(
        this.getRandom(this.action) +
          " " +
          this.getRandom(this.article) +
          " " +
          adj +
          " " +
          thing
      );
    }

    if (this.rng() > 0.7)
      return (
        prefix +
        adv +
        " " +
        this.getRandom(["of", "for", "under", "in", "beyond"]) +
        " " +
        prefix2 +
        stuff
      );
    if (this.rng() > 0.8) return animal + "'s " + adv;
    if (this.rng() > 0.7) return prefix + adv + " of " + stuff;
    if (this.rng() > 0.5) return word + "'s " + adv;
    if (this.rng() > 0.4) return prefix + word;
    return "The " + adv + " of the " + adj + " " + animal;
  },

  getRandomWord: function (lengthMult) {
    if (this.rng() > 0.5)
      return (
        this.getRandom(this.syllables.first) +
        this.getRandom(this.syllables.last)
      );

    if (!lengthMult) lengthMult = 1;
    var s = "";
    if (this.rng() > 0.3) s += this.getRandom(this.syllables.first);

    s += this.getRandom(this.syllables.middle);

    var count = Math.floor(this.rng() * this.rng() * lengthMult * 5);
    for (var i = 0; i < count; i++) {
      var mid = this.getRandom(this.syllables.middle);
      s += mid;
    }

    if (this.rng() > 0.3) s += this.getRandom(this.syllables.last);

    return s;
  },
  getRandomVerb: function () {
    var s = this.getRandom(this.syllables.first);

    var count = Math.floor(this.rng() * 3);
    for (var i = 0; i < count; i++) {
      var mid = this.getRandom(this.syllables.middle);
      s += mid;
    }
    s += this.getRandom(this.syllables.lastVerb);

    return s;
  },
  getRandomID: function (count = 8) {
    let s = "";
    for (var i = 0; i < count; i++) {
      if (this.rng() > 0.4) s += String.fromCharCode(this.rng() * 26 + 65);
      else s += String.fromCharCode(this.rng() * 10 + 48);
    }

    return s;
  },
};

function microtracery(gr, rule) {
  return rule
    .split("#")
    .map((s, index) => {
      if (index % 2 == 0) return s;

      let r = gr[s];
      if (!r) return `((${s}))`;

      r = Array.isArray(r) ? r[Math.floor(r.length * Math.random())] : r;

      return microtracery(gr, r);
    })
    .join("");
}

let testGrammar = {
  greeting: ["nihao", "hi", "hello", "bonjour", "ciao"],
  animal: ["cat", "okapi", "capybara", "emu", "narwhal", "coyote"],
  color: ["pink", "green", "aqua", "silver"],
  mood: ["happy", "elated", "morose", "sleepy", "enigmatic"],
  object: words.object,
  place: words.places,
  objAdj: words.objAdj,
  origin: [
    "#color.a.capitalize# #animal# was #color#, and said <b>#greeting.capitalize#</b>",
    "[myObj:#object#][myColor:#color#]#myColor.a.capitalize# #myObj# was in #place.a#. It was #objAdj# for #myObj.a#",
  ],
};

String.prototype.hashCode = function () {
  var hash = 0,
    i,
    chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

// GPT
function rotateAroundZ(point, theta) {
  const [x, y, z] = point;
  return [
    x * Math.cos(theta) - y * Math.sin(theta),
    x * Math.sin(theta) + y * Math.cos(theta),
    z,
  ];
}

function rotateAroundX(point, phi) {
  const [x, y, z] = point;
  return [
    x,
    y * Math.cos(phi) - z * Math.sin(phi),
    y * Math.sin(phi) + z * Math.cos(phi),
  ];
}

function projectToScreen(point, screenWidth, screenHeight, cameraFocalLength) {
  const [x, y, z] = point;
  return [
    (x * cameraFocalLength) / z + screenWidth / 2,
    (y * cameraFocalLength) / z + screenHeight / 2,
    z,
  ];
}

function convertToWorldToScreen(
  point,
  theta,
  phi,
  screenWidth,
  screenHeight,
  cameraFocalLength,
  cameraRadius
) {
  const rotatedZ = rotateAroundZ(point, theta);
  const rotatedX = rotateAroundX(rotatedZ, phi);
  const offsetPoint = [rotatedX[0], rotatedX[1], rotatedX[2] + cameraRadius];
  return projectToScreen(
    offsetPoint,
    screenWidth,
    screenHeight,
    cameraFocalLength
  );
}

function forGrid(grid, fxn) {
  if (!grid.length) throw "Non-grid";
  let countX = grid.length;

  for (let i = 0; i < countX; i++) {
    let pctX = countX > 1 ? i / (countX - 1) : 0.5;
    let countY = grid[i].length;

    for (let j = 0; j < countY; j++) {
      let pctY = countY > 1 ? j / (countY - 1) : 0.5;
      let countZ = grid[i][j].length;

      if (!countZ) {
        let item = grid[i][j];
        fxn({ item, i, j, pctX, pctY });
      } else {
        for (let k = 0; k < countZ; k++) {
          let pctZ = countZ > 1 ? k / (countZ - 1) : 0.5;
          let item = grid[i][j][k];

          fxn({ item, i, j, k, pctX, pctY, pctZ });
        }
      }
    }
  }
}
