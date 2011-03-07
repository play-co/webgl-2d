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

  var WebGL2D = this.WebGL2D = function WebGL2D(canvas) {
    this.canvas         = canvas;
    this.gl             = undefined;
    this.fs             = undefined;
    this.vs             = undefined;
    this.shaderProgram  = undefined;
    this.transform      = new Transform();

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

  WebGL2D.prototype.getVertexShaderSource = function getVertexShaderSource(stackDepth) {
    stackDepth = stackDepth || 1;
    var w = 2 / this.canvas.width, h = -2 / this.canvas.height;
    var vsSource = [
      "attribute vec4 aVertexPosition;",
      "attribute vec2 aTextureCoord;",

      "uniform vec4 uColor;",
      "uniform mat3 uTransforms[" + stackDepth + "];",

      "varying vec4 vColor;",
      "varying vec2 vTextureCoord;",

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
        "vTextureCoord = aVertexPosition.zw;",
      "}"
    ].join("\n");
    return vsSource;
  };

  WebGL2D.prototype.shaderPool = [];

  // Initialize fragment and vertex shaders
  WebGL2D.prototype.initShaders = function initShaders(transformStackDepth) {
    var gl = this.gl;
    transformStackDepth = transformStackDepth || 1;
    var storedShader = this.shaderPool[transformStackDepth];

    if (storedShader) {
      gl.useProgram(storedShader);
      this.shaderProgram = storedShader;
      return storedShader;
    }
    else {

      var fs = this.fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(this.fs, fsSource);
      gl.compileShader(this.fs);

      var vs = this.vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, this.getVertexShaderSource(transformStackDepth));
      gl.compileShader(vs);

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

      shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");

      shaderProgram.uColor   = gl.getUniformLocation(shaderProgram, 'uColor');
      shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
      shaderProgram.useTexture = gl.getUniformLocation(shaderProgram, 'useTexture');
      shaderProgram.uTransforms = [];
      for (var i=0; i<transformStackDepth; ++i) {
        shaderProgram.uTransforms[i] = gl.getUniformLocation(shaderProgram, 'uTransforms[' + i + ']');
      } //for
      this.shaderPool[transformStackDepth] = shaderProgram;
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

    gl.fillText = function fillText() {};

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
      var shaderProgram = gl2d.initShaders(transform.c_stack+2);

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);

      transform.pushMatrix();

      transform.translate(x, y);
      transform.scale(width, height);

      sendTransformStack(shaderProgram, transform);

      gl.uniform4f(shaderProgram.uColor, fillStyle[0], fillStyle[1], fillStyle[2], fillStyle[3]);
      
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

      transform.popMatrix();
    };

    gl.strokeRect = function strokeRect(x, y, width, height) {
      var transform = gl2d.transform;
      var shaderProgram = gl2d.initShaders(transform.c_stack + 2);

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);

      transform.pushMatrix();

      transform.translate(x, y);
      transform.scale(width, height);

      sendTransformStack(shaderProgram, transform);

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
    var textureCache = [];

    function Texture(image) {
      this.image = image;
      this.obj   = gl.createTexture();
      this.index = textureCache.length;

      gl.bindTexture(gl.TEXTURE_2D, this.obj);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); // requires POT texture
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      //gl.generateMipmap(gl.TEXTURE_2D); // requires POT texture
      gl.bindTexture(gl.TEXTURE_2D, null);

      textureCache.push(this);
    }

    gl.drawImage = function drawImage(image, a, b, c, d, e, f, g, h) {
      var transform = gl2d.transform;
      var shaderProgram = gl2d.initShaders(transform.c_stack + 2);

      var texture, foundImage = false;

      for (var i = 0; i < textureCache.length; i++) {
        if (textureCache[i].image === image) {
          foundImage = true;
          texture = textureCache[i]; 
          break;
        }
      }

      if (!foundImage) {
        texture = new Texture(image);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);

      gl.bindTexture(gl.TEXTURE_2D, texture.obj);
      gl.activeTexture(gl.TEXTURE0);

      transform.pushMatrix();

      if (arguments.length === 3) {
        transform.translate(a, b);
        transform.scale(image.width, image.height);
      } else if (arguments.length === 5) {
        transform.translate(a, b);
        transform.scale(c, d);
      } else if (arguments.length === 9) {
        //throw "Not yet implemented.";
      }

      gl.uniform1i(shaderProgram.useTexture, true);
      gl.uniform1i(shaderProgram.uSampler, 0);

      sendTransformStack(shaderProgram, transform);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

      transform.popMatrix();

      gl.uniform1i(shaderProgram.useTexture, false);
    };
  };

}());
