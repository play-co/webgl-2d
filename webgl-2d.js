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

(function(undefined) {

  var ctx;

  var WebGL2D = this.WebGL2D = function WebGL2D(canvas) {
    ctx = canvas.getContext("experimental-webgl"); 

    return ctx;
  };

  var webgl = WebGLRenderingContext.prototype;

  function colorStringToArray(colorString) {
    return colorString.replace(/[^\d.,]/g, "").split(",");
  }

  Object.defineProperty(webgl, "fillStyle", {
    set: function(value) {
      ctx.clearColor.apply(this, colorStringToArray(value));
    }
  });

  Object.defineProperty(webgl, "strokeStyle", {
    set: function(value) {
      alert(value);
    }
  });

  webgl.fillRect = function fillRect(x, y, width, height) {
    ctx.clear(16640);
  };

}());
