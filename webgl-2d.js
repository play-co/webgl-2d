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
    }
  }; 
    var mat3 = {
    identity: [1.0, 0.0, 0.0,
               0.0, 1.0, 0.0,
               0.0, 0.0, 1.0],
    multiply: function (m1, m2) {
      var mOut = [];
      mOut[0] = m2[0] * m1[0] + m2[3] * m1[1] + m2[6] * m1[2];
      mOut[1] = m2[1] * m1[0] + m2[4] * m1[1] + m2[7] * m1[2];
      mOut[2] = m2[2] * m1[0] + m2[5] * m1[1] + m2[8] * m1[2];
      mOut[3] = m2[0] * m1[3] + m2[3] * m1[4] + m2[6] * m1[5];
      mOut[4] = m2[1] * m1[3] + m2[4] * m1[4] + m2[7] * m1[5];
      mOut[5] = m2[2] * m1[3] + m2[5] * m1[4] + m2[8] * m1[5];
      mOut[6] = m2[0] * m1[6] + m2[3] * m1[7] + m2[6] * m1[8];
      mOut[7] = m2[1] * m1[6] + m2[4] * m1[7] + m2[7] * m1[8];
      mOut[8] = m2[2] * m1[6] + m2[5] * m1[7] + m2[8] * m1[8];
      return mOut;
    },
    vec2_multiply: function (m1, m2) {
      var mOut = [];
      mOut[0] = m2[0] * m1[0] + m2[3] * m1[1] + m2[6];
      mOut[1] = m2[1] * m1[0] + m2[4] * m1[1] + m2[7];
      return mOut;
    },
    transpose: function (m) {
      return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
    }
  }; //mat3

  // Transform library from CubicVR.js
  function Transform(mat) {
    return this.clearStack(mat);
  }

  Transform.prototype.setIdentity = function() {
    this.m_stack[this.c_stack] = this.getIdentity();
    if (this.valid === this.c_stack && this.c_stack) {
      this.valid--;
    }
    return this;
  };

  Transform.prototype.getIdentity = function() {
    return [1.0, 0.0, 0.0, 
            0.0, 1.0, 0.0, 
            0.0, 0.0, 1.0];
  };

  Transform.prototype.getResult = function() {
    if (!this.c_stack) {
      return this.m_stack[0];
    }
    
    var m = mat3.identity;
    
    if (this.valid > this.c_stack-1) { this.valid = this.c_stack-1; }
                
    for (var i = this.valid; i < this.c_stack+1; i++) {
      m = mat3.multiply(this.m_stack[i],m);
      this.m_cache[i] = m;
    }
      
    this.valid = this.c_stack-1;
      
    this.result = this.m_cache[this.c_stack];
    
    return this.result;
  };

  Transform.prototype.pushMatrix = function(m) {
    this.c_stack++;
    this.m_stack[this.c_stack] = (m ? m : mat3.identity);
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

  Transform.prototype.translate = function(x, y) {
    var m = this.getIdentity();
    m[6] = x;
    m[7] = y;
    this.m_stack[this.c_stack] = mat3.multiply(m, this.m_stack[this.c_stack]);

    if (this.valid === this.c_stack && this.c_stack) {
      this.valid--;
    }
    return this;
  }; //translate

  Transform.prototype.scale = function(x, y) {
    var m = this.getIdentity();
    m[0] = x;
    m[4] = y;
    this.m_stack[this.c_stack] = mat3.multiply(m, this.m_stack[this.c_stack]);
    if (this.valid === this.c_stack && this.c_stack) {
      this.valid--;
    }
    return this;
  }; //scale

  Transform.prototype.rotate = function(ang) {
    var sAng, cAng;
    sAng = Math.sin(-ang);
    cAng = Math.cos(-ang);
    var Z_ROT = this.getIdentity();
    Z_ROT[0] = cAng;
    Z_ROT[3] = sAng;
    Z_ROT[1] = -sAng;
    Z_ROT[4] = cAng;
    this.m_stack[this.c_stack] = mat3.multiply(Z_ROT, this.m_stack[this.c_stack]);
    if (this.valid === this.c_stack && this.c_stack) {
      this.valid--;
    }
    return this;
  }; //rotate

  var WebGL2D = this.WebGL2D = function WebGL2D(canvas, options) {
    this.canvas         = canvas;
    this.options        = options || {};
    this.gl             = undefined;
    this.fs             = undefined;
    this.vs             = undefined;
    this.shaderProgram  = undefined;
    this.transform      = new Transform();
    this.shaderPool     = [];
    this.tex_max_size   = undefined;
    
    // Save a reference to the WebGL2D instance on the canvas object
    canvas.gl2d         = this;

    // Store getContext function for later use
    canvas.$getContext  = canvas.getContext;

    // Override getContext function with "webgl-2d" enabled version
    canvas.getContext = (function(gl2d) { 
      return function(context) {
        if (gl2d.options.force || context === "webgl-2d") {
          if (gl2d.gl) { return gl2d.gl; }

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

          gl2d.tex_max_size = gl.getParameter(gl.MAX_TEXTURE_SIZE);

          return gl;
        } else {
          return gl2d.canvas.$getContext(context);
        }
      };
    }(this));

    this.postInit();
  };

  // Enables WebGL2D on your canvas
  WebGL2D.enable = function(canvas, options) {
    return canvas.gl2d || new WebGL2D(canvas, options);
  };

  
  // Shader Pool BitMasks, i.e. sMask = (shaderMask.texture+shaderMask.stroke)
  var shaderMask = {
    texture: 1,
    crop: 2
  };


  // Fragment shader source
  WebGL2D.prototype.getFragmentShaderSource = function getFragmentShaderSource(sMask) {
    var fsSource = [
      "#ifdef GL_ES",
        "precision highp float;",
      "#endif",

      "#define hasTexture "+((sMask&shaderMask.texture)?"1":"0"),
      "#define hasCrop "+((sMask&shaderMask.crop)?"1":"0"),

      "varying vec4 vColor;",
      
      "#if hasTexture",
        "varying vec2 vTextureCoord;",
        "uniform sampler2D uSampler;",
        "#if hasCrop",
          "uniform vec4 uCropSource;",
        "#endif",
      "#endif",
      
      "void main(void) {",
        "#if hasTexture",
          "#if hasCrop",
            "gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x*uCropSource.z,vTextureCoord.y*uCropSource.w)+uCropSource.xy);",
          "#else",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
          "#endif",
        "#else",
          "gl_FragColor = vColor;",
        "#endif",
      "}"
    ].join("\n");

    return fsSource;
  };

  WebGL2D.prototype.getVertexShaderSource = function getVertexShaderSource(stackDepth,sMask) {
    stackDepth = stackDepth || 1;
    var w = 2 / this.canvas.width, h = -2 / this.canvas.height;
    var vsSource = [
      "#define hasTexture "+((sMask&shaderMask.texture)?"1":"0"),
      "attribute vec4 aVertexPosition;",

      "#if hasTexture",
      "varying vec2 vTextureCoord;",
      "#endif",

      "uniform vec4 uColor;",
      "uniform mat3 uTransforms[" + stackDepth + "];",

      "varying vec4 vColor;",
      
      "const mat4 pMatrix = mat4("+w+",0,0,0, 0,"+h+",0,0, 0,0,1.0,1.0, -1.0,1.0,0,0);",

      "mat3 crunchStack(void) {",
        "mat3 result = uTransforms[0];",
        "for (int i=1; i<"+stackDepth+"; ++i) {",
          "result = uTransforms[i] * result;",
        "}",
        "return result;",
      "}",

      "void main(void) {",
        "vec3 position = crunchStack() * vec3(aVertexPosition.x, aVertexPosition.y, 1.0);",
        "gl_Position = pMatrix * vec4(position, 1.0);",
        "vColor = uColor;",
        "#if hasTexture",
          "vTextureCoord = aVertexPosition.zw;",
        "#endif",
      "}"
    ].join("\n");
    return vsSource;
  };


  // Initialize fragment and vertex shaders
  WebGL2D.prototype.initShaders = function initShaders(transformStackDepth,sMask) {
    var gl = this.gl;

    transformStackDepth = transformStackDepth || 1;
    sMask = sMask || 0;
    var storedShader = this.shaderPool[transformStackDepth];

    if (!storedShader) { storedShader = this.shaderPool[transformStackDepth] = []; }
    storedShader = storedShader[sMask];

    if (storedShader) {
      gl.useProgram(storedShader);
      this.shaderProgram = storedShader;
      return storedShader;
    } else {
      var fs = this.fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(this.fs, this.getFragmentShaderSource(sMask));
      gl.compileShader(this.fs);

      if (!gl.getShaderParameter(this.fs, gl.COMPILE_STATUS)) {
        throw "fragment shader error: "+gl.getShaderInfoLog(this.fs);
      }

      var vs = this.vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(this.vs, this.getVertexShaderSource(transformStackDepth,sMask));
      gl.compileShader(this.vs);

      if (!gl.getShaderParameter(this.vs, gl.COMPILE_STATUS)) {
        throw "vertex shader error: "+gl.getShaderInfoLog(this.vs);
      }


      var shaderProgram = this.shaderProgram = gl.createProgram();
      shaderProgram.stackDepth = transformStackDepth;
      gl.attachShader(shaderProgram, fs);
      gl.attachShader(shaderProgram, vs);
      gl.linkProgram(shaderProgram);

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw "Could not initialise shaders.";        
      }

      gl.useProgram(shaderProgram);
  
      shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
      gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

      shaderProgram.uColor   = gl.getUniformLocation(shaderProgram, 'uColor');
      shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
      shaderProgram.uCropSource = gl.getUniformLocation(shaderProgram, 'uCropSource');

      shaderProgram.uTransforms = [];
      for (var i=0; i<transformStackDepth; ++i) {
        shaderProgram.uTransforms[i] = gl.getUniformLocation(shaderProgram, 'uTransforms[' + i + ']');
      } //for
      this.shaderPool[transformStackDepth][sMask] = shaderProgram;
      return shaderProgram;
    } //if
  };

  var rectVertexPositionBuffer;
  var rectVertexColorBuffer;

  // 2D Vertices and Texture UV coords
  var rectVerts = new Float32Array([
      0,0, 0,0, 
      0,1, 0,1, 
      1,1, 1,1, 
      1,0, 1,0
  ]);

  WebGL2D.prototype.initBuffers = function initBuffers() {
    var gl = this.gl;

    rectVertexPositionBuffer  = gl.createBuffer();
    rectVertexColorBuffer     = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rectVerts, gl.STATIC_DRAW);
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

    var reRGBAColor = /^rgb(a)?\(\s*([\d]+)(%)?,\s*([\d]+)(%)?,\s*([\d]+)(%)?,?\s*([\d\.]+)?\s*\)$/;
    var reHex6Color = /^#([0-9A-Fa-f]{6})$/;
    var reHex3Color = /^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/;

    // Converts rgb(a) color string to gl color vector
    function colorStringToVec4(value) {
      var vec4 = [], match;

      if ((match = reRGBAColor.exec(value))) {
        for (var i = 2; i < 8; i+=2) {
          var channel = match[i];
          vec4.push(match[i+1] ? channel / 100 : channel / 255); 
        }
        vec4.push(parseFloat(match[1] && match[8] !== undefined ? match[8] : 1.0));
      } else if ((match = reHex6Color.exec(value))) {
        var colorInt = parseInt(match[1], 16);
        vec4 = [((colorInt & 0xFF0000) >> 16) / 255, ((colorInt & 0x00FF00) >> 8) / 255, (colorInt & 0x0000FF) / 255, 1.0];
      } else if ((match = reHex3Color.exec(value))) {
        var hexString = [match[1], match[1], match[2], match[2], match[3], match[3]].join("");
        var colorInt = parseInt(hexString, 16);
        vec4 = [((colorInt & 0xFF0000) >> 16) / 255, ((colorInt & 0x00FF00) >> 8) / 255, (colorInt & 0x0000FF) / 255, 1.0];
      } else {
      }

      return vec4;
    }

    function colorVecToString(vec4) {
      return "rgba(" + (vec4[0] * 255) + ", " + (vec4[1] * 255) + ", " + (vec4[2] * 255) + ", " + parseFloat(vec4[3]) + ")";
    }

    // Maintain drawing state params during gl.save and gl.restore. see saveDrawState() and restoreDrawState()
    var drawState = {}, drawStateStack = [];

    function saveDrawState() {
      drawStateStack.push(JSON.parse(JSON.stringify(drawState)));
    }

    function restoreDrawState() {
      drawState = drawStateStack.pop();
    }

    // WebGL requires colors as a vector while Canvas2D sets colors as an rgba string
    // These getters and setters store the original rgba string as well as convert to a vector
    drawState.fillStyle = [0, 0, 0, 1]; // default black

    Object.defineProperty(gl, "fillStyle", {
      get: function() { return colorVecToString(drawState.fillStyle); },
      set: function(value) {
        drawState.fillStyle = colorStringToVec4(value); 
      }
    });

    drawState.strokeStyle = [0, 0, 0, 1]; // default black

    Object.defineProperty(gl, "strokeStyle", {
      get: function() { return colorVecToString(drawState.strokeStyle); },
      set: function(value) {
        drawState.strokeStyle = colorStringToVec4(value); 
      }
    });

    // WebGL already has a lineWidth() function but Canvas2D requires a lineWidth property
    // Store the original lineWidth() function for later use
    gl.$lineWidth = gl.lineWidth;
    drawState.lineWidth = 1.0;

    Object.defineProperty(gl, "lineWidth", {
      get: function() { return drawState.lineWidth; },
      set: function(value) {
        gl.$lineWidth(value); 
        drawState.lineWidth = value;
      }
    });
    
    // Currently unsupported attributes and their default values
    drawState.lineCap = "butt";

    Object.defineProperty(gl, "lineCap", {
      get: function() { return drawState.lineCap; },
      set: function(value) {
        drawState.lineCap = value;
      }
    });
    
    drawState.lineJoin = "miter";

    Object.defineProperty(gl, "lineJoin", {
      get: function() { return drawState.lineJoin; },
      set: function(value) {
        drawState.lineJoin = value;
      }
    });

    drawState.miterLimit = 10;

    Object.defineProperty(gl, "miterLimit", {
      get: function() { return drawState.miterLimit; },
      set: function(value) {
        drawState.miterLimit = value;
      }
    });

    drawState.shadowOffsetX = 0;

    Object.defineProperty(gl, "shadowOffsetX", {
      get: function() { return drawState.shadowOffsetX; },
      set: function(value) {
        drawState.shadowOffsetX = value;
      }
    });

    drawState.shadowOffsetY = 0;

    Object.defineProperty(gl, "shadowOffsetY", {
      get: function() { return drawState.shadowOffsetY; },
      set: function(value) {
        drawState.shadowOffsetY = value;
      }
    });

    drawState.shadowBlur = 0;

    Object.defineProperty(gl, "shadowBlur", {
      get: function() { return drawState.shadowBlur; },
      set: function(value) {
        drawState.shadowBlur = value;
      }
    });

    drawState.shadowColor = "rgba(0, 0, 0, 0.0)";

    Object.defineProperty(gl, "shadowColor", {
      get: function() { return drawState.shadowColor; },
      set: function(value) {
        drawState.shadowColor = value;
      }
    });

    drawState.font = "10px sans-serif";

    Object.defineProperty(gl, "font", {
      get: function() { return drawState.font; },
      set: function(value) {
        drawState.font = value;
      }
    });

    drawState.textAlign = "start";

    Object.defineProperty(gl, "textAlign", {
      get: function() { return drawState.textAlign; },
      set: function(value) {
        drawState.textAlign = value;
      }
    });

    drawState.textBaseline = "alphabetic";

    Object.defineProperty(gl, "textBaseline", {
      get: function() { return drawState.textBaseline; },
      set: function(value) {
        drawState.textBaseline = value;
      }
    });

    // This attribute will need to control global alpha of objects drawn.
    drawState.globalAlpha = 1.0;

    Object.defineProperty(gl, "globalAlpha", {
      get: function() { return drawState.globalAlpha; },
      set: function(value) {
        drawState.globalAlpha = value;
      }
    });

    // This attribute will need to set the gl.blendFunc mode
    drawState.globalCompositeOperation = "source-over"; 

    Object.defineProperty(gl, "globalCompositeOperation", {
      get: function() { return drawState.globalCompositeOperation; },
      set: function(value) {
        drawState.globalCompositeOperation = value;
      }
    });


    gl.fillText = function fillText() {};
    
    gl.strokeText = function strokeText() {};
    
    gl.measureText = function measureText() { return 1; };

    var tempCanvas = document.createElement('canvas');
    var tempCtx = tempCanvas.getContext('2d');

    gl.save = function save() {
      gl2d.transform.pushMatrix();
      saveDrawState();
    };

    gl.restore = function restore() {
      gl2d.transform.popMatrix();
      restoreDrawState();
    };

    gl.translate = function translate(x, y) {
      gl2d.transform.translate(x, y);
    }; 

    gl.rotate = function rotate(a) {
      gl2d.transform.rotate(a);
    };

    gl.scale = function scale(x, y) {
      gl2d.transform.scale(x, y);
    };

    gl.createImageData = function createImageData(width, height) {
      return tempCtx.createImageData(width, height);
    };

    gl.getImageData = function getImageData(x, y, width, height) {
      var data = tempCtx.createImageData(width, height);
      var buffer = new Uint8Array(width*height*4);
      gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
      var w=width*4, h=height;
      for (var i=0, maxI=h/2; i<maxI; ++i) {
        for (var j=0, maxJ=w; j<maxJ; ++j) {
          var index1 = i * w + j;
          var index2 = (h-i-1) * w + j;
          data.data[index1] = buffer[index2];
          data.data[index2] = buffer[index1];
        } //for
      } //for

      return data;
    };

    gl.putImageData = function putImageData(imageData, x, y) {
      gl.drawImage(imageData, x, y);
    };

    gl.transform = function transform(m11, m12, m21, m22, dx, dy) {
      var m = gl2d.transform.m_stack[gl2d.transform.c_stack];

      m[0] *= m11;
      m[1] *= m21;
      m[2] *= dx;
      m[3] *= m12;
      m[4] *= m22;
      m[5] *= dy;
      m[6] = 0;
      m[7] = 0;
    };

    function sendTransformStack(sp, transform) {
      var stack = transform.m_stack;
      for (var i=0, maxI=transform.c_stack+1; i<maxI; ++i) {
        gl.uniformMatrix3fv(sp.uTransforms[i], false, stack[maxI-1-i]);
      } //for
    }

    gl.setTransform = function setTransform(m11, m12, m21, m22, dx, dy) {
      gl2d.transform.setIdentity();
      gl.transform.apply(this, arguments);
    };

    gl.fillRect = function fillRect(x, y, width, height) {
      var transform = gl2d.transform;
      var shaderProgram = gl2d.initShaders(transform.c_stack+2,0);

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);

      transform.pushMatrix();

      transform.translate(x, y);
      transform.scale(width, height);

      sendTransformStack(shaderProgram, transform);

      gl.uniform4f(shaderProgram.uColor, drawState.fillStyle[0], drawState.fillStyle[1], drawState.fillStyle[2], drawState.fillStyle[3]);
      
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

      transform.popMatrix();
    };

    gl.strokeRect = function strokeRect(x, y, width, height) {
      var transform = gl2d.transform;
      var shaderProgram = gl2d.initShaders(transform.c_stack + 2,0);

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);

      transform.pushMatrix();

      transform.translate(x, y);
      transform.scale(width, height);

      sendTransformStack(shaderProgram, transform);

      gl.uniform4f(shaderProgram.uColor, drawState.strokeStyle[0], drawState.strokeStyle[1], drawState.strokeStyle[2], drawState.strokeStyle[3]);

      gl.drawArrays(gl.LINE_LOOP, 0, 4);

      transform.popMatrix();
    };

    gl.clearRect = function clearRect() {};

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
        gl.moveTo(x, y);
      }
    };

    gl.quadraticCurveTo = function quadraticCurveTo() {};

    gl.bezierCurveTo = function bezierCurveTo() {};

    gl.arcTo = function arcTo() {};

    // Adds a closed rect subpath and creates a new subpath
    gl.rect = function rect(x, y, w, h) {
      gl.moveTo(x, y);
      gl.lineTo(x + w, y);
      gl.lineTo(x + w, y + h);
      gl.lineTo(x, y + h);
      gl.closePath();
    };

    gl.arc = function arc() {};

    gl.fill = function fill() {};

    gl.stroke = function stroke() {};

    gl.clip = function clip() {};

    gl.isPointInPath = function isPointInPath() {};

    gl.drawFocusRing = function drawFocusRing() {};

    

    var imageCache = [], textureCache = [];

    function Texture(image) {
      this.obj   = gl.createTexture();
      this.index = textureCache.push(this);

      imageCache.push(image); 

      // we may wish to consider tiling large images like this instead of scaling and
      // adjust appropriately (flip to next texture source and tile offset) when drawing
      if (image.width>gl2d.tex_max_size || image.height>gl2d.tex_max_size) {
        var canvas = document.createElement("canvas");
        canvas.width = (image.width>gl2d.tex_max_size)?gl2d.tex_max_size:image.width;
        canvas.height = (image.height>gl2d.tex_max_size)?gl2d.tex_max_size:image.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(image,
                      0, 0, image.width, image.height,
                      0, 0, canvas.width, canvas.height);
        image = canvas;
      }

      gl.bindTexture(gl.TEXTURE_2D, this.obj);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); // requires POT texture
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      //gl.generateMipmap(gl.TEXTURE_2D); // requires POT texture
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    gl.drawImage = function drawImage(image, a, b, c, d, e, f, g, h) {
      var transform = gl2d.transform;

      transform.pushMatrix();

      var sMask = shaderMask.texture;
      var doCrop = false;

      //drawImage(image, dx, dy)
      if (arguments.length === 3) {
        transform.translate(a, b);
        transform.scale(image.width, image.height);
      } 

      //drawImage(image, dx, dy, dw, dh)
      else if (arguments.length === 5) {
        transform.translate(a, b);
        transform.scale(c, d);
      } 

      //drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) 
      else if (arguments.length === 9) {
        transform.translate(e, f);
        transform.scale(g, h);
        sMask = sMask|shaderMask.crop;
        doCrop = true;
      }

      var shaderProgram = gl2d.initShaders(transform.c_stack, sMask);

      var texture, cacheIndex = imageCache.indexOf(image);

      if (cacheIndex !== -1) {
        texture = textureCache[cacheIndex];   
      } else {
        texture = new Texture(image);  
      }

      if (doCrop) {
        gl.uniform4f(shaderProgram.uCropSource, a/image.width, b/image.height, c/image.width, d/image.height);        
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);

      gl.bindTexture(gl.TEXTURE_2D, texture.obj);
      gl.activeTexture(gl.TEXTURE0);

      gl.uniform1i(shaderProgram.uSampler, 0);

      sendTransformStack(shaderProgram, transform);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

      transform.popMatrix();
    };
  };

}());
