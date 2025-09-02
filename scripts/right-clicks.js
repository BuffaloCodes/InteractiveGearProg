(function () {
  function getChartRoot() {
    return (
      document.getElementById('chart-container') ||
      document.getElementById('chart_gear') ||
      document.getElementById('chart_milestones')
    );
  }

  function bind(root) {
    if (!root) return;
    // Example minimal binding. Replace with your real context-menu code when ready.
    root.addEventListener('contextmenu', function (ev) {
      const node = ev.target.closest('.node');
      if (!node) return; // let the browser show its default menu elsewhere
      ev.preventDefault();
      // For now do nothing. This prevents crashes and keeps the door open for your menu.
      // You can inspect node.title or node.dataset.wikiLink here if you want to add behavior.
    });
  }

  // Try now if the DOM is already present
  const now = getChartRoot();
  if (now) {
    bind(now);
  } else {
    // Otherwise bind after DOM ready
    document.addEventListener('DOMContentLoaded', function () {
      bind(getChartRoot());
    });
  }
})();
