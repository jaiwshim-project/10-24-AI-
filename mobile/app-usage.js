(() => {
  let device = null;
  let test = new URLSearchParams(location.search).get('usage') === 'test';
  try {
    if (test) sessionStorage.setItem('roleplay-test-tab', '1');
    test = test || sessionStorage.getItem('roleplay-test-tab') === '1';
    const key = 'roleplay-analytics-device-v1';
    device = localStorage.getItem(key) || crypto.randomUUID();
    localStorage.setItem(key, device);
  } catch { /* Visits still count without device storage. */ }
  function record(event) {
    fetch('/api/interview-analytics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, device, test, standalone: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true }), keepalive: true
    }).catch(() => {});
  }
  window.addEventListener('appinstalled', () => record('install'), { once: true });
  if (performance.getEntriesByType('navigation')[0]?.type === 'navigate') record('visit');
})();
