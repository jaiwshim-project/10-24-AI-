(() => {
  function record(event) {
    fetch('/api/interview-analytics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }), keepalive: true
    }).catch(() => {});
  }
  window.addEventListener('appinstalled', () => record('install'), { once: true });
  if (performance.getEntriesByType('navigation')[0]?.type === 'navigate') record('visit');
})();
