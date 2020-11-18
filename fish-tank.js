define("types", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    ;
});
define("index", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports.clear = void 0;
    exports.clear = function (gl, colour) {
        gl.clearColor(colour.r, colour.g, colour.b, colour.a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };
});
