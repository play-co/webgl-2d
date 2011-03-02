/** 
 *  WebGL-2D.js - HTML5 Canvas2D API in a WebGL context
 * 
 *  Created by Corban Brook <corbanbrook@gmail.com> on 2011-03-02.
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

  var WebGL2D = this.WebGL2D = function WebGL2D(canvas) {
    this.canvas         = canvas;
    this.gl             = undefined;
    this.fs             = undefined;
    this.vs             = undefined;
    this.shaderProgram  = undefined;
    this.fillStyle      = [0, 0, 0, 1]; // default black
    this.strokeStyle    = [0, 0, 0, 1]; // default black

    // Store getContext function for later use
    canvas.$getContext = canvas.getContext;

    // Override getContext function with "webgl-2d" enabled version
    canvas.getContext = (function(gl2d) { 
      return function(context) {
        switch(context) {
          case "2d":
            return    gl2d.canvas.$getContext(context);

          case "webgl-2d":
            gl2d.gl = gl2d.canvas.$getContext("experimental-webgl");

            gl2d.initShaders();
            gl2d.addCanvas2DAPI();

            // Default white background
            gl2d.gl.clearColor(1, 1, 1, 1);
            gl2d.gl.clear(gl2d.gl.COLOR_BUFFER_BIT);

            return gl2d.gl;
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
  var fsSource =
  '#ifdef GL_ES                                \n\
    precision highp float;                     \n\
    #endif                                     \n\
                                               \n\
    varying vec4 vColor;                       \n\
                                               \n\
    void main(void) {                          \n\
      gl_FragColor = vColor;                   \n\
    }                                          \n\
  ';

  // Vertex shader source
  var vsSource =
  'attribute vec3 aVertexPosition;             \n\
    attribute vec4 aVertexColor;               \n\
                                               \n\
    varying vec4 vColor;                       \n\
                                               \n\
    void main(void) {                          \n\
      gl_Position = vec4(aVertexPosition, 1.0);\n\
      vColor = aVertexColor;                   \n\
    }                                          \n\
  ';

  // Initialize fragment and vertex shaders
  WebGL2D.prototype.initShaders = function initShaders() {
    var gl = this.gl;

    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fs, fsSource);
    gl.compileShader(this.fs);

    this.vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vs, vsSource);
    gl.compileShader(this.vs);

    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, this.vs);
    gl.attachShader(this.shaderProgram, this.fs);
    gl.linkProgram(this.shaderProgram);

    gl.useProgram(this.shaderProgram);

    this.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

    this.shaderProgram.vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
  };

  // Maintains an array of all WebGL2D instances
  WebGL2D.instances = [];

  WebGL2D.prototype.postInit = function() {
    WebGL2D.instances.push(this);    
  };

  // Extends gl context with Canvas2D API
  WebGL2D.prototype.addCanvas2DAPI = function addCanvas2DAPI() {
    var gl2d = this,
        gl   = this.gl;

    // Converts rgb(a) color string to gl color array
    function colorStringToArray(colorString) {
      var glColor = colorString.replace(/[^\d.,]/g, "").split(",");
      glColor[0] /= 255; glColor[1] /= 255; glColor[2] /= 255;

      return glColor;
    }

    // Setter for fillStyle
    Object.defineProperty(gl, "fillStyle", {
      set: function(value) {
        gl2d.fillStyle = colorStringToArray(value); 
      }
    });

    // Setter for strokeStyle
    Object.defineProperty(gl, "strokeStyle", {
      set: function(value) {
        gl2d.strokeStyle = colorStringToArray(value); 
      }
    });

    var rectVertexPositionBuffer;
    var rectVertexColorBuffer;
    var rectVerts = new Float32Array([0,0,0, 0,1,0, 1,1,0, 1,0,0]);

    gl.fillRect = function fillRect(x, y, width, height) {
      // for now just set the background color to the fillStyle
      //this.clearColor.apply(this, gl2d.fillStyle);
      //this.clear(this.COLOR_BUFFER_BIT);
      
      rectVertexPositionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);

      gl.bufferData(gl.ARRAY_BUFFER, rectVerts, gl.STATIC_DRAW);

      rectVertexColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexColorBuffer);

      
      var colors = [];

      for (var i = 0; i < 4; i++) {
        colors.push(gl2d.fillStyle[0]);
        colors.push(gl2d.fillStyle[1]);
        colors.push(gl2d.fillStyle[2]);
        colors.push(gl2d.fillStyle[3]);
      }

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexPositionBuffer);
      gl.vertexAttribPointer(gl2d.shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, rectVertexColorBuffer);
      gl.vertexAttribPointer(gl2d.shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    };
  };

}());
