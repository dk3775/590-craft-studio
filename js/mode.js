/* Runs synchronously in <head> (tiny, no dependencies) so the correct layout
   is applied before first paint and there is no flash between the 3D layout
   and the lightweight layout.
   "3d"   = desktop/tablet-landscape, WebGL available, motion allowed, not Save-Data
   "lite" = everything else (phones, reduced motion, no WebGL, low memory, Save-Data) */
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  function webglOK() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return false;
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return true;
    } catch (e) { return false; }
  }

  var conn = navigator.connection || {};
  var lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4;
  var capable = webglOK() && !conn.saveData && !lowMemory;

  window.__ALU_CAN_3D = capable;

  window.__aluPickMode = function () {
    var wide = window.matchMedia('(min-width: 900px) and (min-height: 560px)').matches;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return capable && wide && !reduce ? '3d' : 'lite';
  };

  root.setAttribute('data-mode', window.__aluPickMode());
})();
