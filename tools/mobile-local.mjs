import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import interview from '../api/interview.js';

const host = '127.0.0.1';
const port = 3210;
const assets = {
  '/mobile/': ['index.html', 'text/html; charset=utf-8'],
  '/mobile/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/mobile/mobile.css': ['mobile.css', 'text/css; charset=utf-8'],
  '/mobile/feedback-history.js': ['feedback-history.js', 'text/javascript; charset=utf-8'],
  '/mobile/feedback-example.json': ['feedback-example.json', 'application/json; charset=utf-8'],
  '/mobile/interview-overview.js': ['interview-overview.js', 'text/javascript; charset=utf-8'],
  '/mobile/mobile.js': ['mobile.js', 'text/javascript; charset=utf-8'],
  '/mobile/sw.js': ['sw.js', 'text/javascript; charset=utf-8'],
  '/mobile/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json'],
  '/mobile/icon-192.png': ['icon-192.png', 'image/png'],
  '/mobile/icon-512.png': ['icon-512.png', 'image/png'],
  '/mobile/og-cover.jpg': ['og-cover.jpg', 'image/jpeg'],
  '/mobile/interview-hero.jpg': ['interview-hero.jpg', 'image/jpeg'],
  '/mobile/favicon.png': ['favicon.png', 'image/png'],
  '/mobile/brand-icon-192.png': ['brand-icon-192.png', 'image/png'],
  '/mobile/brand-icon-512.png': ['brand-icon-512.png', 'image/png']
};

function json(response, code, body) {
  response.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function serveAPI(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { error: 'POST 요청만 지원합니다.' });
  }

  let length = 0;
  const chunks = [];
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 256000) return json(response, 413, { error: '답변이 너무 깁니다.' });
    chunks.push(chunk);
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return json(response, 400, { error: '요청 내용을 읽을 수 없습니다.' });
  }
  const adapter = {
    setHeader: (name, value) => response.setHeader(name, value),
    status: code => ({ json: data => json(response, code, data) })
  };
  await interview({ method: request.method, body }, adapter);
}

const server = createServer(async (request, response) => {
  // A local browser must not be able to call the developer API from another site.
  const origin = request.headers.origin;
  const allowedOrigins = ['http://127.0.0.1:3210', 'http://localhost:3210'];
  if (origin && !allowedOrigins.includes(origin)) return json(response, 403, { error: '로컬 앱에서만 요청할 수 있습니다.' });
  const path = new URL(request.url, 'http://' + host).pathname;
  try {
    if (path === '/api/interview') return await serveAPI(request, response);
    if (request.method === 'GET' && (path === '/' || path === '/mobile')) {
      response.writeHead(302, { Location: '/mobile/' });
      return response.end();
    }
    if (request.method === 'GET' && Object.hasOwn(assets, path)) {
      const [file, contentType] = assets[path];
      const content = await readFile(new URL('../mobile/' + file, import.meta.url));
      response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
      return response.end(content);
    }
    json(response, 404, { error: '페이지를 찾을 수 없습니다.' });
  } catch (error) {
    console.error('[mobile-local]', error.code ?? error.name);
    if (!response.headersSent) json(response, 500, { error: '로컬 서버 오류가 발생했습니다.' });
    else response.end();
  }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? '포트 3210을 사용 중입니다.' : '로컬 서버를 열지 못했습니다: ' + error.code);
  process.exitCode = 1;
});
server.listen(port, host, () => console.log('Roleplay AI Coach: http://127.0.0.1:3210/mobile/'));
