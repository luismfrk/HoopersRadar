import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');
const dataDir = join(__dirname, 'data');
const stateFile = join(dataDir, 'state.json');
const port = Number(process.env.PORT || 3001);

const initialState = {
  user: null,
  profile: {
    name: '',
    username: '',
    age: '',
    height: '',
    weight: '',
    position: 'Armador',
    level: 'Intermediario',
    availability: '',
    characteristics: '',
    history: '',
    city: 'Mallet-PR',
    bannerUrl: '',
    avatarUrl: '',
    rankingPoints: 0,
  },
  partners: [],
  courts: [
    {
      id: 'c1',
      name: 'Quadra Municipal de Mallet',
      address: 'Centro, Mallet-PR',
      lat: -25.8813,
      lng: -50.8245,
      price: 'Gratuita',
      surface: 'Piso cimento',
      status: 'Comunidade local',
      occupancy: 'Media',
    },
    {
      id: 'c2',
      name: 'Quadra Publica de Curitiba',
      address: 'Agua Verde, Curitiba-PR',
      lat: -25.4484,
      lng: -49.2769,
      price: 'Gratuita',
      surface: 'Piso cimento',
      status: 'Aberta hoje',
      occupancy: 'Alta',
    },
    {
      id: 'c3',
      name: 'Ginasio em Ponta Grossa',
      address: 'Centro, Ponta Grossa-PR',
      lat: -25.0945,
      lng: -50.1633,
      price: 'R$ 30/h',
      surface: 'Piso madeira',
      status: 'Reserva indicada',
      occupancy: 'Media',
    },
    {
      id: 'c4',
      name: 'Quadra da Orla',
      address: 'Boa Viagem, Recife-PE',
      lat: -8.1259,
      lng: -34.8996,
      price: 'Gratuita',
      surface: 'Piso externo',
      status: 'Aberta agora',
      occupancy: 'Baixa',
    },
  ],
  posts: [],
};

function loadState() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(stateFile)) {
    writeFileSync(stateFile, JSON.stringify(initialState, null, 2));
    return structuredClone(initialState);
  }

  return JSON.parse(readFileSync(stateFile, 'utf8'));
}

let state = loadState();

state.user = {
  ...(state.user || {}),
};
if (!state.user.email) state.user = null;
state.profile = {
  ...initialState.profile,
  ...state.profile,
  username: state.profile?.username || state.user?.username || initialState.profile.username,
};
saveState();

const seededPartnerIds = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
const seededPostIds = new Set(['s1', 's2', 's3']);
state.partners = (state.partners || []).filter((partner) => !seededPartnerIds.has(partner.id));
state.posts = (state.posts || []).filter((post) => !seededPostIds.has(post.id));
state.courts = Array.isArray(state.courts) && state.courts.length ? state.courts : initialState.courts;
saveState();

function saveState() {
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) req.destroy();
    });
    req.on('end', () => {
      if (!raw) {
        resolveBody({});
        return;
      }

      try {
        resolveBody(JSON.parse(raw));
      } catch (error) {
        rejectBody(error);
      }
    });
  });
}

function serveStatic(req, res) {
  const distDir = join(rootDir, 'dist');
  const requestedPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = join(distDir, decodeURIComponent(requestedPath));

  if (!filePath.startsWith(distDir) || !existsSync(filePath)) {
    const indexPath = join(distDir, 'index.html');
    if (existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(readFileSync(indexPath));
      return;
    }
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
  }[extname(filePath)] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(readFileSync(filePath));
}

function filteredPartners(url) {
  const position = url.searchParams.get('position');
  const q = (url.searchParams.get('q') || '').toLowerCase();

  return state.partners.filter((partner) => {
    const matchPosition = position ? partner.position === position : true;
    const matchQuery = q ? `${partner.name} ${partner.city} ${partner.neighborhood}`.toLowerCase().includes(q) : true;
    return matchPosition && matchQuery;
  });
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  try {
    if (url.pathname === '/api/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!state.user || !email || !password || email !== state.user.email || password !== state.user.password) {
        sendJson(res, 401, { error: 'Conta nao cadastrada ou senha incorreta' });
        return;
      }

      state.user = { ...state.user, token: `token-${Date.now()}` };
      saveState();
      sendJson(res, 200, { token: state.user.token, user: state.user, profile: state.profile });
      return;
    }

    if (url.pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const username = String(body.username || '').trim().toLowerCase();
      const profile = body.profile || {};

      if (!email || !password || !username || !profile.name) {
        sendJson(res, 400, { error: 'Dados de cadastro incompletos' });
        return;
      }

      if (state.user && email === state.user.email) {
        sendJson(res, 409, { error: 'Email ja cadastrado' });
        return;
      }

      state.user = {
        id: `u-${Date.now()}`,
        email,
        password,
        username,
        token: `token-${Date.now()}`,
      };
      state.profile = { ...initialState.profile, ...profile, username };
      saveState();
      sendJson(res, 201, { token: state.user.token, user: state.user, profile: state.profile });
      return;
    }

    if (url.pathname === '/api/bootstrap' && req.method === 'GET') {
      sendJson(res, 200, {
        profile: state.profile,
        partners: state.partners,
        courts: state.courts,
        posts: state.posts,
      });
      return;
    }

    if (url.pathname === '/api/profile' && req.method === 'GET') {
      sendJson(res, 200, state.profile);
      return;
    }

    if (url.pathname === '/api/profile' && req.method === 'PUT') {
      const body = await readBody(req);
      state.profile = { ...state.profile, ...body };
      if (typeof body.username === 'string' && body.username.trim()) {
        state.user = state.user ? { ...state.user, username: body.username.trim().toLowerCase() } : state.user;
      }
      saveState();
      sendJson(res, 200, state.profile);
      return;
    }

    if (url.pathname === '/api/partners' && req.method === 'GET') {
      sendJson(res, 200, filteredPartners(url));
      return;
    }

    if (url.pathname === '/api/courts' && req.method === 'GET') {
      sendJson(res, 200, state.courts);
      return;
    }

    if (url.pathname === '/api/posts' && req.method === 'GET') {
      sendJson(res, 200, state.posts);
      return;
    }

    if (url.pathname === '/api/posts' && req.method === 'POST') {
      const body = await readBody(req);
      const text = String(body.text || '').trim();
      if (!text) {
        sendJson(res, 400, { error: 'Post text is required' });
        return;
      }

      const post = {
        id: `user-${Date.now()}`,
        author: body.author || state.profile.name || 'Voce',
        handle: body.handle || '@meu.hoops',
        role: body.role || state.profile.position || 'Hooper',
        city: body.city || state.profile.city || 'Mallet-PR',
        time: 'agora',
        text,
        tag: body.tag || 'post',
        imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
        likes: 0,
        replies: 0,
        reposts: 0,
        liked: false,
        reposted: false,
      };
      state.posts = [post, ...state.posts];
      saveState();
      sendJson(res, 201, post);
      return;
    }

    const postActionMatch = url.pathname.match(/^\/api\/posts\/([^/]+)\/(like|repost)$/);
    if (postActionMatch && req.method === 'POST') {
      const [, id, action] = postActionMatch;
      const post = state.posts.find((item) => item.id === id);
      if (!post) {
        sendJson(res, 404, { error: 'Post not found' });
        return;
      }

      if (action === 'like') {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
      } else {
        post.reposted = !post.reposted;
        post.reposts += post.reposted ? 1 : -1;
      }
      saveState();
      sendJson(res, 200, post);
      return;
    }

    if (url.pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: 'API route not found' });
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Server error' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Hoopers API running on http://0.0.0.0:${port}`);
});
