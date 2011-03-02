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
      return function(contextString) {
        if (contextString === "2d") {
          return (webgl2d.cvs.$getContext(contextString));
        } else if (contextString === "webgl-2d") {
          webgl2d.ctx = webgl2d.cvs.$getContext("experimental-webgl");
          webgl2d.addCanvas2DAPI();
          return webgl2d.ctx;
        }
      };
    }(this));

    this.postInit();
  };

  // Enables WebGL2D on your canvas
  WebGL2D.enable = function(canvas) {
    return new WebGL2D(canvas);
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
