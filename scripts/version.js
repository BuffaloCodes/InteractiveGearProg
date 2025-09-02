(function () {
  try {
    var el = document.getElementById('version');
    if (!el) return; // nothing to do
    // Simple example version string. Replace with your own logic if you want.
    el.textContent = 'v' + (window.APP_VERSION || '1.0.0');
  } catch (e) {
    // fail silent
  }
})();
