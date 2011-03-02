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
    this.cvs = canvas;

    // Store getContext function for later use
    canvas.$getContext = canvas.getContext;

    // Override getContext function with "webgl-2d" enabled version
    canvas.getContext = (function(webgl2d) { 
      return function(context) {
        switch(context) {
          case "2d":
            return webgl2d.cvs.$getContext(context);
            break;

          case "webgl-2d":
            return webgl2d.initGL();
            break;
        }
      };
    }(this));

    this.postInit();
  };

  // Enables WebGL2D on your canvas
  WebGL2D.enable = function(canvas) {
    return new WebGL2D(canvas);
  };

  WebGL2D.prototype.initGL = function initGL() {
    this.ctx = this.cvs.$getContext("experimental-webgl");

    this.initShaders();
    this.addCanvas2DAPI();

    return this.ctx;
  };

  var fsSource =
  '#ifdef GL_ES                                \n\
    precision highp float;                     \n\
    #endif                                     \n\
                                               \n\
    void main(void) {                          \n\
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); \n\
    }                                          \n\
  ';

  var vsSource =
  'attribute vec3 aVertexPosition;             \n\
                                               \n\
    void main(void) {                          \n\
      gl_Position = vec4(aVertexPosition, 1.0);\n\
    }                                          \n\
  ';

  // Initialize fragment and vertex shaders
  WebGL2D.prototype.initShaders = function initShaders() {
    var gl = this.ctx;

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
  };

  // Maintains an array of all WebGL2D instances
  WebGL2D.instances = [];

  WebGL2D.prototype.postInit = function() {
    WebGL2D.instances.push(this);    
  };

  WebGL2D.prototype.addCanvas2DAPI = function addCanvas2DAPI() {
    var webgl = WebGLRenderingContext.prototype,
          ctx = this.ctx;

    function colorStringToArray(colorString) {
      var glColor = colorString.replace(/[^\d.,]/g, "").split(",");
      glColor[0] /= 255; glColor[1] /= 255; glColor[2] /= 255;

      return glColor;
    }

    // Define setters for fillStyle and strokeStyle
    Object.defineProperty(ctx, "fillStyle", {
      set: function(value) {
        this.clearColor.apply(this, colorStringToArray(value));
      }
    });

    Object.defineProperty(ctx, "strokeStyle", {
      set: function(value) {
      }
    });

    ctx.fillRect = function fillRect(x, y, width, height) {
      this.clear(16640);
    };
  };

}());
