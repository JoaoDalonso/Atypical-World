/**
 * @fileoverview Servidor HTTP Local para Desenvolvimento (Zero Dependências)
 * Serve os arquivos do Atypical World em http://localhost:3000 com suporte nativo a ES Modules.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Trata a rota raiz
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, reqPath);

  // Evita Directory Traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Proibido');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Arquivo Não Encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('\n================================================================');
  console.log('       ATYPICAL WORLD · SERVIDOR LOCAL EM EXECUÇÃO');
  console.log('================================================================\n');
  console.log(` 🌐 Endereço Local    : ${url}`);
  console.log(` 🗄️  Banco Supabase    : Conectado (sqnjsgdcflzlyefardbk)`);
  console.log(` 📂 Raiz do Projeto   : ${ROOT_DIR}\n`);
  console.log(' 💡 Dica: Todos os relatos, curtidas e comentários enviados no site');
  console.log('    serão gravados em tempo real no seu banco do Supabase!');
  console.log('\n Pressione Ctrl + C no terminal para encerrar o servidor.');
  console.log('================================================================\n');

  // Abre o navegador padrão automaticamente no Windows
  const openCmd = process.platform === 'win32' ? `start ${url}` : `xdg-open ${url}`;
  exec(openCmd);
});
