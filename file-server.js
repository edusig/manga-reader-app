const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const os = require('os');
const qrcode = require('qrcode-terminal');

const manga_dir = '/Users/work/Manga';
const extToMimeDict = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  git: 'image/gif',
  webp: 'image/webp',
};

/**
 *
 * @param {string} root
 * @param {number} depth
 */
const dirWalk = (currentDir, depth = 2) => {
  const root = path.join(manga_dir, currentDir);
  const dirs = fs
    .readdirSync(root)
    .filter((it) => !it.startsWith('_') && it !== '.DS_Store')
    .map((it) => {
      const subpath = path.join(root, it);
      const localPath = path.join(currentDir, it);
      if (depth > 0 && fs.existsSync(subpath) && fs.lstatSync(subpath).isDirectory()) {
        const subdirs = dirWalk(localPath, depth - 1);
        return {
          name: it,
          files: subdirs,
          count: subdirs.length,
          fullPath: localPath,
        };
      }
      return it;
    });
  return dirs;
};

/**
 *
 * @param {http.ServerResponse} res
 */
const listDirs = (res) => {
  const dirs = dirWalk('.');
  res.writeHead(200);
  res.end(JSON.stringify({ count: dirs.length, data: dirs }));
};

/**
 *
 * @param {http.ServerResponse} res
 * @param {string} dir
 */
const download = (res, dir) => {
  if (dir == null) {
    res.writeHead(400);
    return res.end();
  }
  const subpath = path.join(manga_dir, dir);
  if (!fs.existsSync(subpath) || !fs.lstatSync(subpath).isFile()) {
    res.writeHead(404);
    return res.end();
  }
  const stat = fs.statSync(subpath);
  const ext = dir.split('.').at(-1);
  const mime = extToMimeDict[ext];
  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': stat.size,
  });
  const stream = fs.createReadStream(subpath);
  stream.pipe(res);
};

/**
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
const requestListener = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname.startsWith('/download')) {
    return download(res, parsedUrl.query.file);
  }
  return listDirs(res);
};

const server = http.createServer(requestListener);
server.listen(9090);
console.log('listening on port 9090');

const localIp = Object.values(os.networkInterfaces())
  .flat()
  .find((it) => it.family === 'IPv4' && it.address.startsWith('192.168')).address;
const serverUrl = `http://${localIp}:9090`;
console.log(`Server url:\n${serverUrl}`);
qrcode.generate(serverUrl, (generated) => {
  console.log(generated);
});
