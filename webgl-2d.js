/** 
 *  WebGL-2D.js - HTML5 Canvas2D API in a WebGL context
 * 
 *  Created by Corban Brook <corbanbrook@gmail.com> on 2011-03-02.
 *  Amended to by Bobby Richter <secretrobotron@gmail.com> on 2011-03-03
 *  CubicVR.js by Charles Cliffe <cj@cubicproductions.com> on 2011-03-03
 *
 */

/*  
 *  Copyright (c) 2011 Corban Brook
 * 
 *  Permission is hereby granted, free of charge, to any person obtaining
 *  a copy of this software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 *  without limitation the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to
 *  the following conditions:
 *  
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * Usage:
 * 
 *    var cvs = document.getElementById("myCanvas");
 * 
 *    WebGL2D.enable(cvs); // adds "webgl-2d" to cvs
 *
 *    cvs.getContext("webgl-2d");
 *
 */

(function(undefined) {

  // Vector & Matrix libraries from CubicVR.js
  var M_PI = 3.1415926535897932384626433832795028841968;
  var M_TWO_PI = 2.0 * M_PI;
  var M_HALF_PI = M_PI / 2.0;

  var vec3 = {
    length: function(pt) {
      return Math.sqrt(pt[0] * pt[0] + pt[1] * pt[1] + pt[2] * pt[2]);
    },
    normalize: function(pt) {
      var d = Math.sqrt((pt[0] * pt[0]) + (pt[1] * pt[1]) + (pt[2] * pt[2]));
      if (d === 0) {
        return [0, 0, 0];
      }
      return [pt[0] / d, pt[1] / d, pt[2] / d];
    },
    dot: function(v1, v2) {
      return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    },
    angle: function(v1, v2) {
      return Math.acos((v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]) / (Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]) * Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2])));
    },
    cross: function(vectA, vectB) {
      return [vectA[1] * vectB[2] - vectB[1] * vectA[2], vectA[2] * vectB[0] - vectB[2] * vectA[0], vectA[0] * vectB[1] - vectB[0] * vectA[1]];
    },
    multiply: function(vectA, constB) {
      return [vectA[0] * constB, vectA[1] * constB, vectA[2] * constB];
    },
    add: function(vectA, vectB) {
      return [vectA[0] + vectB[0], vectA[1] + vectB[1], vectA[2] + vectB[2]];
    },
    subtract: function(vectA, vectB) {
      return [vectA[0] - vectB[0], vectA[1] - vectB[1], vectA[2] - vectB[2]];
    },
    equal: function(a, b) {
      var epsilon = 0.0000001;
      if ((a === undefined) && (b === undefined)) {
        return true;
      }
      if ((a === undefined) || (b === undefined)) {
        return false;
      }
      return (Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon && Math.abs(a[2] - b[2]) < epsilon);
    },
  }; 

  var mat4 = {
    identity: [1.0, 0.0, 0.0, 0.0,
               0.0, 1.0, 0.0, 0.0,
               0.0, 0.0, 1.0, 0.0,
               0.0, 0.0, 0.0, 1.0],

    multiply: function (m1, m2) {
      var mOut = [];
      mOut[0] = m2[0] * m1[0] + m2[4] * m1[1] + m2[8] * m1[2] + m2[12] * m1[3];
      mOut[1] = m2[1] * m1[0] + m2[5] * m1[1] + m2[9] * m1[2] + m2[13] * m1[3];
      mOut[2] = m2[2] * m1[0] + m2[6] * m1[1] + m2[10] * m1[2] + m2[14] * m1[3];
      mOut[3] = m2[3] * m1[0] + m2[7] * m1[1] + m2[11] * m1[2] + m2[15] * m1[3];
      mOut[4] = m2[0] * m1[4] + m2[4] * m1[5] + m2[8] * m1[6] + m2[12] * m1[7];
      mOut[5] = m2[1] * m1[4] + m2[5] * m1[5] + m2[9] * m1[6] + m2[13] * m1[7];
      mOut[6] = m2[2] * m1[4] + m2[6] * m1[5] + m2[10] * m1[6] + m2[14] * m1[7];
      mOut[7] = m2[3] * m1[4] + m2[7] * m1[5] + m2[11] * m1[6] + m2[15] * m1[7];
      mOut[8] = m2[0] * m1[8] + m2[4] * m1[9] + m2[8] * m1[10] + m2[12] * m1[11];
      mOut[9] = m2[1] * m1[8] + m2[5] * m1[9] + m2[9] * m1[10] + m2[13] * m1[11];
      mOut[10] = m2[2] * m1[8] + m2[6] * m1[9] + m2[10] * m1[10] + m2[14] * m1[11];
      mOut[11] = m2[3] * m1[8] + m2[7] * m1[9] + m2[11] * m1[10] + m2[15] * m1[11];
      mOut[12] = m2[0] * m1[12] + m2[4] * m1[13] + m2[8] * m1[14] + m2[12] * m1[15];
      mOut[13] = m2[1] * m1[12] + m2[5] * m1[13] + m2[9] * m1[14] + m2[13] * m1[15];
      mOut[14] = m2[2] * m1[12] + m2[6] * m1[13] + m2[10] * m1[14] + m2[14] * m1[15];
      mOut[15] = m2[3] * m1[12] + m2[7] * m1[13] + m2[11] * m1[14] + m2[15] * m1[15];
      return mOut;
    },
    vec4_multiply: function (m1, m2) {
      var mOut = [];
      mOut[0] = m2[0] * m1[0] + m2[4] * m1[1] + m2[8] * m1[2] + m2[12] * m1[3];
      mOut[1] = m2[1] * m1[0] + m2[5] * m1[1] + m2[9] * m1[2] + m2[13] * m1[3];
      mOut[2] = m2[2] * m1[0] + m2[6] * m1[1] + m2[10] * m1[2] + m2[14] * m1[3];
      mOut[3] = m2[3] * m1[0] + m2[7] * m1[1] + m2[11] * m1[2] + m2[15] * m1[3];
      return mOut;
    },
    vec3_multiply: function (m1, m2) {
      var mOut = [];
      mOut[0] = m2[0] * m1[0] + m2[4] * m1[1] + m2[8] * m1[2] + m2[12];
      mOut[1] = m2[1] * m1[0] + m2[5] * m1[1] + m2[9] * m1[2] + m2[13];
      mOut[2] = m2[2] * m1[0] + m2[6] * m1[1] + m2[10] * m1[2] + m2[14];
      return mOut;
    },
    perspective: function (fovy, aspect, near, far) {
      var yFac = Math.tan(fovy * M_PI / 360.0);
      var xFac = yFac * aspect;
      return [1.0 / xFac, 0, 0, 0, 0, 1.0 / yFac, 0, 0, 0, 0, -(far + near) / (far - near), -1, 0, 0, -(2.0 * far * near) / (far - near), 0];
    },
    determinant: function (m) {
      var a0 = m[0] * m[5] - m[1] * m[4];
      var a1 = m[0] * m[6] - m[2] * m[4];
      var a2 = m[0] * m[7] - m[3] * m[4];
      var a3 = m[1] * m[6] - m[2] * m[5];
      var a4 = m[1] * m[7] - m[3] * m[5];
      var a5 = m[2] * m[7] - m[3] * m[6];
      var b0 = m[8] * m[13] - m[9] * m[12];
      var b1 = m[8] * m[14] - m[10] * m[12];
      var b2 = m[8] * m[15] - m[11] * m[12];
      var b3 = m[9] * m[14] - m[10] * m[13];
      var b4 = m[9] * m[15] - m[11] * m[13];
      var b5 = m[10] * m[15] - m[11] * m[14];
      var det = a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0;
      return det;
    },
    transpose: function (m) {
      return [m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14], m[3], m[7], m[11], m[15]];
    },
    inverse: function (m) {
      var a0 = m[0] * m[5] - m[1] * m[4];
      var a1 = m[0] * m[6] - m[2] * m[4];
      var a2 = m[0] * m[7] - m[3] * m[4];
      var a3 = m[1] * m[6] - m[2] * m[5];
      var a4 = m[1] * m[7] - m[3] * m[5];
      var a5 = m[2] * m[7] - m[3] * m[6];
      var b0 = m[8] * m[13] - m[9] * m[12];
      var b1 = m[8] * m[14] - m[10] * m[12];
      var b2 = m[8] * m[15] - m[11] * m[12];
      var b3 = m[9] * m[14] - m[10] * m[13];
      var b4 = m[9] * m[15] - m[11] * m[13];
      var b5 = m[10] * m[15] - m[11] * m[14];
      var determinant = a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0;
      if (determinant != 0) {
        var m_inv = [];
        m_inv[0] = 0 + m[5] * b5 - m[6] * b4 + m[7] * b3;
        m_inv[4] = 0 - m[4] * b5 + m[6] * b2 - m[7] * b1;
        m_inv[8] = 0 + m[4] * b4 - m[5] * b2 + m[7] * b0;
        m_inv[12] = 0 - m[4] * b3 + m[5] * b1 - m[6] * b0;
        m_inv[1] = 0 - m[1] * b5 + m[2] * b4 - m[3] * b3;
        m_inv[5] = 0 + m[0] * b5 - m[2] * b2 + m[3] * b1;
        m_inv[9] = 0 - m[0] * b4 + m[1] * b2 - m[3] * b0;
        m_inv[13] = 0 + m[0] * b3 - m[1] * b1 + m[2] * b0;
        m_inv[2] = 0 + m[13] * a5 - m[14] * a4 + m[15] * a3;
        m_inv[6] = 0 - m[12] * a5 + m[14] * a2 - m[15] * a1;
        m_inv[10] = 0 + m[12] * a4 - m[13] * a2 + m[15] * a0;
        m_inv[14] = 0 - m[12] * a3 + m[13] * a1 - m[14] * a0;
        m_inv[3] = 0 - m[9] * a5 + m[10] * a4 - m[11] * a3;
        m_inv[7] = 0 + m[8] * a5 - m[10] * a2 + m[11] * a1;
        m_inv[11] = 0 - m[8] * a4 + m[9] * a2 - m[11] * a0;
        m_inv[15] = 0 + m[8] * a3 - m[9] * a1 + m[10] * a0;
        var inverse_det = 1.0 / determinant;
        m_inv[0] *= inverse_det;
        m_inv[1] *= inverse_det;
        m_inv[2] *= inverse_det;
        m_inv[3] *= inverse_det;
        m_inv[4] *= inverse_det;
        m_inv[5] *= inverse_det;
        m_inv[6] *= inverse_det;
        m_inv[7] *= inverse_det;
        m_inv[8] *= inverse_det;
        m_inv[9] *= inverse_det;
        m_inv[10] *= inverse_det;
        m_inv[11] *= inverse_det;
        m_inv[12] *= inverse_det;
        m_inv[13] *= inverse_det;
        m_inv[14] *= inverse_det;
        m_inv[15] *= inverse_det;
        return m_inv;
      }
      return null; 
    },
    lookat: function(eyex, eyey, eyez, centerx, centery, centerz, upx, upy, upz) {
      var forward = [], side = [], up = [];
      var m = [];
      forward[0] = centerx - eyex;
      forward[1] = centery - eyey;
      forward[2] = centerz - eyez;
      up[0] = upx;
      up[1] = upy;
      up[2] = upz;
      forward = vec3.normalize(forward);
      /* Side = forward x up */
      var side = vec3.cross(forward, up);
      size = vec3.normalize(side);
      /* Recompute up as: up = side x forward */
      up = vec3.cross(side, forward);
      var m = [ side[0], up[0], -forward[0], 0, side[1], up[1], -forward[1], 0, side[2], up[2], -forward[2], 0, 0, 0, 0, 1];
      var t = new Transform();
      t.translate([-eyex,-eyey,-eyez]);
      t.pushMatrix(m);
      return t.getResult();
    }
  }; //mat4

  // Transform library from CubicVR.js
  function Transform(mat) {
    return this.clearStack(mat);
  };

  Transform.prototype.setIdentity = function() {
    this.m_stack[this.c_stack] = this.getIdentity();
    if (this.valid === this.c_stack && this.c_stack) {
      this.valid--;
    }
    return this;
  };

  Transform.prototype.getIdentity = function() {
    return [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0];
  };

  Transform.prototype.getResult = function() {
    if (!this.c_stack) {
      return this.m_stack[0];
    }
    
    var m = mat4.identity;
    
    if (this.valid > this.c_stack-1) this.valid = this.c_stack-1;
                
    for (var i = this.valid; i < this.c_stack+1; i++) {
      m = mat4.multiply(this.m_stack[i],m);
      this.m_cache[i] = m;
    }
      
    this.valid = this.c_stack-1;
      
    this.result = this.m_cache[this.c_stack];
    
    return this.result;
  };

  Transform.prototype.pushMatrix = function(m) {
    this.c_stack++;
    this.m_stack[this.c_stack] = (m ? m : mat4.identity);
    return this;
  };

  Transform.prototype.popMatrix = function() {
    if (this.c_stack === 0) {
      return;
    }
    this.c_stack--;
    return this;
  }; //popMatrix

  Transform.prototype.clearStack = function(init_mat) {
    this.m_stack = [];
    this.m_cache = [];
    this.c_stack = 0;
    this.valid = 0;
    this.result = null;

    if (init_mat !== undefined) {
      this.m_stack[0] = init_mat;
    } else {
      this.setIdentity();
    }

    return this;
  }; //clearStack

  Transform.prototype.translate = function(x, y, z) {
    if (typeof(x) === 'object') {
      return this.translate(x[0], x[1], x[2]);
    }

    var m = this.getIdentity();
    m[12] = x;
    m[13] = y;
    m[14] = z;
    this.m_stack[this.c_stack] = mat4.multiply(m, this.m_stack[this.c_stack]);

    if (this.valid === this.c_stack && this.c_stack) {
      this.valid--;
    }
    return this;
  }; //translate

  Transform.prototype.scale = function(x, y, z) {
    if (typeof(x) === 'object') {
      return this.scale(x[0], x[1], x[2]);
    }
    var m = this.getIdentity();
    m[0] = x;
    m[5] = y;
    m[10] = z;
    this.m_stack[this.c_stack] = mat4.multiply(m, this.m_stack[this.c_stack]);
    if (this.valid === this.c_stack && this.c_stack) {
      this.valid--;
    }
    return this;
  }; //scale

  Transform.prototype.rotate = function(ang, x, y, z) {
    if (typeof(ang) === 'object') {
      this.rotate(ang[0], 1, 0, 0);
      this.rotate(ang[1], 0, 1, 0);
      this.rotate(ang[2], 0, 0, 1);
      return this;
    }
    var sAng, cAng;
    if (x || y || z) {
      sAng = Math.sin(-ang);
      cAng = Math.cos(-ang);
    }
    if (z) {
      var Z_ROT = this.getIdentity();
      Z_ROT[0] = cAng * z;
      Z_ROT[4] = sAng * z;
      Z_ROT[1] = -sAng * z;
      Z_ROT[5] = cAng * z;
      this.m_stack[this.c_stack] = mat4.multiply(Z_ROT, this.m_stack[this.c_stack]);
    }
    if (y) {
      var Y_ROT = this.getIdentity();
      Y_ROT[0] = cAng * y;
      Y_ROT[8] = -sAng * y;
      Y_ROT[2] = sAng * y;
      Y_ROT[10] = cAng * y;
      this.m_stack[this.c_stack] = mat4.multiply(Y_ROT, this.m_stack[this.c_stack]);
    }
    if (x) {
      var X_ROT = this.getIdentity();
      X_ROT[5] = cAng * x;
      X_ROT[9] = sAng * x;
      X_ROT[6] = -sAng * x;
      X_ROT[10] = cAng * x;
      this.m_stack[this.c_stack] = mat4.multiply(X_ROT, this.m_stack[this.c_stack]);
    }
    if (this.valid === this.c_stack && this.c_stack) {
      this.valid--;
    }
    return this;
  }; //rotate

  var WebGL2D = this.WebGL2D = function WebGL2D(canvas) {
    this.canvas         = canvas;
    this.gl             = undefined;
    this.fs             = undefined;
    this.vs             = undefined;
    this.shaderProgram  = undefined;
    this.transform      = new Transform();
    this.pMatrix        = [2/canvas.width, 0, 0, 0,
                           0, -2/canvas.height, 0, 0,
                           0, 0, 1, 1,
                          -1, 1, 0, 1];

    // Store getContext function for later use
    canvas.$getContext = canvas.getContext;

    // Override getContext function with "webgl-2d" enabled version
    canvas.getContext = (function(gl2d) { 
      return function(context) {
        switch(context) {
          case "2d":
            return gl2d.canvas.$getContext(context);

          case "webgl-2d":
            var gl = gl2d.gl = gl2d.canvas.$getContext("experimental-webgl");

            gl2d.initShaders();
            gl2d.initBuffers();
            gl2d.initCanvas2DAPI();

            gl.viewport(0, 0, gl2d.canvas.width, gl2d.canvas.height);

            // Default white background
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT); // | gl.DEPTH_BUFFER_BIT);

            // Disables writing to dest-alpha
            gl.colorMask(1,1,1,0);

            // Depth options
            //gl.enable(gl.DEPTH_TEST);
            //gl.depthFunc(gl.LEQUAL);

            // Blending options
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            return gl;
        }
      };
    }(this));

    this.postInit();
  };

  // Enables WebGL2D on your canvas
  WebGL2D.enable = function(canvas) {
    return new WebGL2D(canvas);
  };

  // Fragment shader source
  var fsSource = [
    "#ifdef GL_ES",
      "precision highp float;",
    "#endif",

    "varying vec4 vColor;",
    "varying vec2 vTextureCoord;",

    "uniform sampler2D uSampler;",
    "uniform bool useTexture;",

    "void main(void) {",
      "if (useTexture) {",
        "gl_FragColor = texture2D(uSampler, vTextureCoord);",
      "} else {",
        "gl_FragColor = vColor;",
      "}",
    "}"
  ].join("\n");

  // Vertex shader source
  var vsSource = [
    "attribute vec3 aVertexPosition;",
    "attribute vec2 aTextureCoord;",

    // "attribute vec4 aVertexColor;",

    "uniform mat4 uOMatrix;",
    "uniform mat4 uPMatrix;",
    "uniform vec4 uColor;",

    "varying vec4 vColor;",
    "varying vec2 vTextureCoord;",

    "void main(void) {",
      "gl_Position = uPMatrix * uOMatrix * vec4(aVertexPosition, 1.0);",
      // "vColor = aVertexColor;",
      "vColor = uColor;",
      "vTextureCoord = aTextureCoord;",
    "}"
  ].join("\n");

  // Initialize fragment and vertex shaders
  WebGL2D.prototype.initShaders = function initShaders() {
    var gl = this.gl;

    var fs = this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fs, fsSource);
    gl.compileShader(this.fs);

    var vs = this.vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    var shaderProgram = this.shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, fs);
    gl.attachShader(shaderProgram, vs);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw "Could not initialise shaders.";
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");

    // this.shaderProgram.vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexColor");
    // gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);

    shaderProgram.uOMatrix = gl.getUniformLocation(shaderProgram, 'uOMatrix');
    shaderProgram.uPMatrix = gl.getUniformLocation(shaderProgram, 'uPMatrix');
    shaderProgram.uColor   = gl.getUniformLocation(shaderProgram, 'uColor');
    shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
    shaderProgram.useTexture = gl.getUniformLocation(shaderProgram, 'useTexture');
  };

  var rectVertexPositionBuffer;
  var rectVertexColorBuffer;
  var texVBO;
  var rectVerts = new Float32Array([0,0,0, 0,1,0, 1,1,0, 1,0,0]);
  var rectUVs   = new Float32Array([0,0, 0,1, 1,1, 1,0]);

  WebGL2D.prototype.initBuffers = function initBuffers() {
    var gl = this.gl;

    rectVertexPositionBuffer  = gl.createBuffer();
    rectVertexColorBuffer     = gl.createBuffer();
    texVBO                    = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rectVerts, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, texVBO);
    gl.bufferData(gl.ARRAY_BUFFER, rectUVs, gl.STATIC_DRAW);
  };

  // Maintains an array of all WebGL2D instances
  WebGL2D.instances = [];

  WebGL2D.prototype.postInit = function() {
    WebGL2D.instances.push(this);    
  };

  // Extends gl context with Canvas2D API
  WebGL2D.prototype.initCanvas2DAPI = function initCanvas2DAPI() {
    var gl2d = this,
        gl   = this.gl;

    // Converts rgb(a) color string to gl color vector
    function colorStringToVec4(colorString) {
      var glColor = colorString.replace(/[^\d.,]/g, "").split(",");
      glColor[0] /= 255; glColor[1] /= 255; 
      glColor[2] /= 255; glColor[3] = parseFloat(glColor[3] || 1);

      return glColor;
    }

    // WebGL requires colors as a vector while Canvas2D sets colors as an rgba string
    // These getters and setters store the original rgba string as well as convert to a vector
    var fillStyle  = [0, 0, 0, 1]; // default black
    var fillString = "rgba(0, 0, 0, 1.0)";

    Object.defineProperty(gl, "fillStyle", {
      get: function() { return fillString; },
      set: function(value) {
        fillStyle   = colorStringToVec4(value); 
        fillString  = value;
      }
    });

    var strokeStyle   = [0, 0, 0, 1]; // default black
    var strokeString  = "rgba(0, 0, 0, 1.0)";

    Object.defineProperty(gl, "strokeStyle", {
      get: function() { return strokeString; },
      set: function(value) {
        strokeStyle   = colorStringToVec4(value); 
        strokeString  = value;
      }
    });

    // WebGL already has a lineWidth() function but Canvas2D requires a lineWidth property
    // Store the original lineWidth() function for later use
    gl.$lineWidth = gl.lineWidth;
    var lineWidth = 1.0;

    Object.defineProperty(gl, "lineWidth", {
      get: function() { return lineWidth; },
      set: function(value) {
        gl.$lineWidth(value); 
      }
    });
    
    // Currently unsupported attributes and their default values
    gl.lineCap        = "butt";
    gl.lineJoin       = "miter";
    gl.miterLimit     = 10;
    gl.shadowOffsetX  = 0;
    gl.shadowOffsetY  = 0;
    gl.shadowBlur     = 0;
    gl.shadowColor    = "rgba(0, 0, 0, 0)";
    gl.font           = "10px sans-serif";
    gl.textAlign      = "start";

    // This attribute will need to control global alpha of objects drawn.
    gl.globalAlpha    = 1.0;

    var tempCanvas = document.createElement('CANVAS');
    var tempCtx = tempCanvas.getContext('2d');

    // This attribute will need to set the gl.blendFunc mode
    gl.globalCompositeOperation = "source-over"; 

    gl.save = function save() {
      gl2d.transform.pushMatrix();
    };

    gl.restore = function restore() {
      gl2d.transform.popMatrix();
    };

    gl.translate = function translate(x, y) {
      gl2d.transform.translate([x, y, 0]);
    }; 

    gl.rotate = function rotate(a) {
      gl2d.transform.rotate([0, 0, a]);
    };

    gl.scale = function scale(x, y) {
      gl2d.transform.scale([x, y, 0]);
    };

    gl.createImageData = function createImageData(width, height) {
      return tempCtx.createImageData(width, height);
    };

    gl.getImageData = function getImageData(x, y, width, height) {
      var data = tempCtx.createImageData(width, height);
      gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data.data);
      var w=width*4, h=height;
      for (var i=0, maxI=h/2; i<maxI; ++i) {
        for (var j=0, maxJ=w; j<maxJ; ++j) {
          var index1 = i * w + j;
          var index2 = (h-i-1) * w + j;
          var temp = data.data[index1];
          data.data[index1] = data.data[index2];
          data.data[index2] = temp;
        } //for
      } //for

      return data;
    };

    gl.putImageData = function putImageData(imageData, x, y) {
      gl.drawImage(imageData, x, y);
    };

    gl.transform = function transform(m11, m12, m21, m22, dx, dy) {
      var m = gl2d.transform.m_stack[gl2d.transform.c_stack];

      /*
      var m2 = [m11, m21, dx, m12, m22, dy, 0, 0, 1];
      
      gl2d.transform.m_stack[gl2d.transform.c_stack] = mat4.multiply(m1, m2);
      */
      m[0] *= m11;
      m[1] *= m21;
      m[2] *= dx;
      m[3] *= m12;
      m[4] *= m22;
      m[5] *= dy;
      m[6] = 0;
      m[7] = 0;
    };

    gl.setTransform = function setTransform(m11, m12, m21, m22, dx, dy) {
      gl2d.transform.setIdentity();
      gl.transform.apply(this, arguments);
    };

    gl.fillRect = function fillRect(x, y, width, height) {
      var shaderProgram = gl2d.shaderProgram, transform = gl2d.transform;

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      transform.pushMatrix();

      transform.translate(x, y, 0);
      transform.scale(width, height, 1);

      gl.uniformMatrix4fv(shaderProgram.uOMatrix, false, transform.getResult());
      gl.uniformMatrix4fv(shaderProgram.uPMatrix, false, gl2d.pMatrix);
      gl.uniform4f(shaderProgram.uColor, fillStyle[0], fillStyle[1], fillStyle[2], fillStyle[3]);
      
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

      transform.popMatrix();
    };

    gl.strokeRect = function strokeRect(x, y, width, height) {
      var shaderProgram = gl2d.shaderProgram, transform = gl2d.transform;

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      transform.pushMatrix();

      transform.translate(x, y, 0);
      transform.scale(width, height, 1);

      gl.uniformMatrix4fv(shaderProgram.uOMatrix, false, transform.getResult());
      gl.uniformMatrix4fv(shaderProgram.uPMatrix, false, gl2d.pMatrix);
      gl.uniform4f(shaderProgram.uColor, strokeStyle[0], strokeStyle[1], strokeStyle[2], strokeStyle[3]);

      gl.drawArrays(gl.LINE_LOOP, 0, 4);

      transform.popMatrix();
    };


    var subPaths = [];

    function SubPath(x, y) {
      this.closed = false;
      this.verts = [[x, y]];
    }

    // Empty the list of subpaths so that the context once again has zero subpaths
    gl.beginPath = function beginPath() {
      subPaths.length = 0;
    };

    // Mark last subpath as closed and create a new subpath with the same starting point as the previous subpath
    gl.closePath = function closePath() {
      if (subPaths.length) {
        // Mark last subpath closed.
        var prevPath = subPaths[subPaths.length -1], startX = prevPath.verts[0][0], startY = prevPath.verts[0][1];
        prevPath.closed = true;

        // Create new subpath using the starting position of previous subpath
        var newPath = new SubPath(startX, startY);
        subPaths.push(newPath);
      }
    };

    // Create a new subpath with the specified point as its first (and only) point
    gl.moveTo = function moveTo(x, y) {
      subPaths.push(new SubPath(x, y));
    };

    gl.lineTo = function lineTo(x, y) {
      if (subPaths.length) {
        subPaths[subPaths.length -1].verts.push([x, y]);
      } else {
        // Create a new subpath if none currently exist
        moveTo(x, y);
      }
    };

    // Adds a closed rect subpath and creates a new subpath
    gl.rect = function rect(x, y, w, h) {
      moveTo(x, y);
      lineTo(x + w, y);
      lineTo(x + w, y + h);
      lineTo(x, y + h);
      closePath();
    };

    gl.fill = function fill() {
    };

    gl.stroke = function stroke() {
    };

    //drawImage(image, dx, dy)
    //drawImage(image, dx, dy, dw, dh)
    //drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) 
    gl.drawImage = function drawImage(image, a, b, c, d, e, f, g, h) {
      var shaderProgram = gl2d.shaderProgram, transform = gl2d.transform;
      var texture = gl.createTexture();

      gl.enableVertexAttribArray(gl2d.shaderProgram.textureCoordAttribute);

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, texVBO);
      gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

      transform.pushMatrix();

      transform.translate(a, b, 0);
      transform.scale(image.width, image.height, 1);

        
      gl.activeTexture(gl.TEXTURE0);

      gl.uniformMatrix4fv(shaderProgram.uOMatrix, false, transform.getResult());
      gl.uniformMatrix4fv(shaderProgram.uPMatrix, false, gl2d.pMatrix);
      gl.uniform1i(shaderProgram.useTexture, true);
      gl.uniform1i(shaderProgram.uSampler, 0);

      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

      transform.popMatrix();

      if (arguments.length === 3) {
      } else if (arguments.length === 5) {
      } else if (arguments.length === 9) {
      }

      gl.disableVertexAttribArray(gl2d.shaderProgram.textureCoordAttribute);
    };
  };

}());
