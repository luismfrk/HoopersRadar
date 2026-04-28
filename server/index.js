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
  user: {
    id: 'u1',
    email: 'demo@hoopers.local',
    password: 'demo',
    username: 'hooperdemo',
    token: 'demo-token',
  },
  profile: {
    name: 'Hooper Demo',
    username: 'hooperdemo',
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
  },
  partners: [
    {
      id: 'p1',
      name: 'Lucas Ferreira',
      position: 'Armador',
      level: 'Intermediario',
      availability: 'Noites durante a semana',
      description: 'Bom passe, gosta de 3x3 e organiza bem jogos de meia quadra.',
      city: 'Mallet-PR',
      neighborhood: 'Centro',
      matchScore: 96,
      rating: 4.8,
    },
    {
      id: 'p2',
      name: 'Bruna Costa',
      position: 'Ala',
      level: 'Avancado',
      availability: 'Tercas e quintas',
      description: 'Atleta rapida, otima defesa no perimetro e transicao muito forte.',
      city: 'Curitiba-PR',
      neighborhood: 'Agua Verde',
      matchScore: 91,
      rating: 4.9,
    },
    {
      id: 'p3',
      name: 'Rafael Nascimento',
      position: 'Pivo',
      level: 'Iniciante',
      availability: 'Fim de semana tarde',
      description: 'Forte no garrafao, bom reboteiro e procurando evoluir em pick-and-roll.',
      city: 'Ponta Grossa-PR',
      neighborhood: 'Centro',
      matchScore: 82,
      rating: 4.5,
    },
    {
      id: 'p4',
      name: 'Marina Alves',
      position: 'Ala',
      level: 'Intermediario',
      availability: 'Sabados de manha',
      description: 'Arremesso consistente do canto, comunicativa na defesa e pontual nos treinos.',
      city: 'Florianopolis-SC',
      neighborhood: 'Trindade',
      matchScore: 82,
      rating: 4.7,
    },
    {
      id: 'p5',
      name: 'Diego Martins',
      position: 'Armador',
      level: 'Avancado',
      availability: 'Domingos pela manha',
      description: 'Leitura de jogo acima da media, bom controle de bola e gosta de jogos 3x3.',
      city: 'Belo Horizonte-MG',
      neighborhood: 'Savassi',
      matchScore: 78,
      rating: 4.6,
    },
    {
      id: 'p6',
      name: 'Ana Souza',
      position: 'Pivo',
      level: 'Intermediario',
      availability: 'Quartas a noite',
      description: 'Boa presenca no garrafao, protege o aro e chama treino coletivo.',
      city: 'Recife-PE',
      neighborhood: 'Boa Viagem',
      matchScore: 75,
      rating: 4.6,
    },
  ],
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
  posts: [
    {
      id: 's1',
      author: 'Lucas Ferreira',
      handle: '@lucas.mallet',
      role: 'Armador',
      city: 'Mallet-PR',
      time: '12 min',
      text: 'Alguem de Mallet fecha 3x3 hoje a noite no Centro? Da para montar um rachao se aparecer mais dois.',
      tag: 'MalletPR',
      likes: 18,
      replies: 6,
      reposts: 3,
      liked: false,
      reposted: false,
    },
    {
      id: 's2',
      author: 'Bruna Costa',
      handle: '@brunacrossover',
      role: 'Ala',
      city: 'Curitiba-PR',
      time: '28 min',
      text: 'Treino bom hoje: 100 lances livres, 40 pull-ups e 20 minutos de drible fraco. Quem estiver em Curitiba cola junto.',
      tag: 'TreinoLivre',
      likes: 31,
      replies: 9,
      reposts: 7,
      liked: false,
      reposted: false,
    },
    {
      id: 's3',
      author: 'Rafael Nascimento',
      handle: '@rafa.rebote',
      role: 'Pivo',
      city: 'Ponta Grossa-PR',
      time: '1 h',
      text: 'Quadra no Centro esta tranquila agora. Se alguem quiser trabalhar garrafao e rebote, estou indo.',
      tag: 'QuadraVazia',
      likes: 12,
      replies: 4,
      reposts: 2,
      liked: false,
      reposted: false,
    },
  ],
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
  id: state.user?.id || 'u1',
  email: state.user?.email || initialState.user.email,
  password: state.user?.password || initialState.user.password,
  username: state.user?.username || state.profile?.username || initialState.user.username,
  token: state.user?.token || initialState.user.token,
};
state.profile = {
  ...initialState.profile,
  ...state.profile,
  username: state.profile?.username || state.user.username || initialState.profile.username,
};
saveState();

if (!state.partners?.some((partner) => partner.city === 'Mallet-PR')) {
  state = {
    ...state,
    profile: { ...initialState.profile, name: state.profile?.name || initialState.profile.name },
    partners: initialState.partners,
    courts: initialState.courts,
    posts: initialState.posts,
  };
  saveState();
}

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

      if (!email || !password || email !== state.user.email || password !== state.user.password) {
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

      if (email === state.user.email && state.user.email !== initialState.user.email) {
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

server.listen(port, () => {
  console.log(`Hoopers API running on http://127.0.0.1:${port}`);
});
