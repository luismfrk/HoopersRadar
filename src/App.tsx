import { FormEvent, useMemo, useState } from 'react';
import { api } from './api';
import Icon from './components/Icon';
import LoginScreen from './components/LoginScreen';
import SocialFeed from './components/SocialFeed';
import { mockCourts, mockPartners, mockPosts, mockStories } from './data/mockData';
import { Court, Partner, PlayerProfile, SocialPost, Story } from './types';

type View = 'feed' | 'explore' | 'runs' | 'direct' | 'notifications' | 'profile';
type DirectMessage = {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
};

type DirectThread = {
  id: string;
  name: string;
  handle: string;
  city: string;
  online: boolean;
  messages: DirectMessage[];
};

type PickupRun = {
  id: string;
  courtId: string;
  title: string;
  time: string;
  players: string;
  notes: string;
  host: string;
  going: string[];
};

type AppNotification = {
  id: string;
  kind: 'follow' | 'like' | 'story' | 'run' | 'post' | 'system';
  title: string;
  text: string;
  time: string;
  read: boolean;
  actor?: string;
};

const positions = ['Armador', 'Ala', 'Pivo'];
const levels = ['Iniciante', 'Intermediario', 'Avancado'];
const postThumbs = [
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1627627256672-027a4613d028?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?auto=format&fit=crop&w=500&q=80',
];

const directSeed: DirectThread[] = [
  {
    id: 'dm-taigo',
    name: 'Taigo Alves',
    handle: '@agrotaigo',
    city: 'Curitiba-PR',
    online: true,
    messages: [
      { id: 'm1', from: 'them', text: 'Vai ter treino livre hoje as 20h?', time: '12:40' },
      { id: 'm2', from: 'me', text: 'Se fechar mais dois, eu colo.', time: '12:42' },
    ],
  },
  {
    id: 'dm-lucas',
    name: 'Lucas Rocha',
    handle: '@lucasrocha',
    city: 'Mallet-PR',
    online: true,
    messages: [
      { id: 'm3', from: 'them', text: 'Centro ta livre hoje. Bora montar 3x3?', time: '09:18' },
      { id: 'm4', from: 'me', text: 'Bora. Vou chamar a galera no feed.', time: '09:21' },
    ],
  },
  {
    id: 'dm-ana',
    name: 'Ana Martins',
    handle: '@anamartins',
    city: 'Ponta Grossa-PR',
    online: false,
    messages: [
      { id: 'm5', from: 'them', text: 'Manda aquele exercicio de arremesso depois.', time: 'ontem' },
    ],
  },
];

const runSeed: PickupRun[] = [
  {
    id: 'run-mallet-night',
    courtId: 'c1',
    title: '3x3 no Centro',
    time: 'Hoje, 20:00',
    players: 'Faltam 2',
    notes: 'Nivel intermediario, so chegar com bola se tiver.',
    host: 'Lucas Ferreira',
    going: ['Lucas Ferreira', 'Rafael Nascimento'],
  },
  {
    id: 'run-curitiba-free',
    courtId: 'c2',
    title: 'Treino livre + meia quadra',
    time: 'Amanha, 18:30',
    players: 'Aberto',
    notes: 'Comeca com arremesso e fecha jogo depois.',
    host: 'Bruna Costa',
    going: ['Bruna Costa'],
  },
];

const notificationSeed: AppNotification[] = [
  {
    id: 'nt-lucas-follow',
    kind: 'follow',
    title: 'Novo seguidor',
    text: 'Lucas Ferreira comecou a seguir voce.',
    time: 'agora',
    read: false,
    actor: 'Lucas Ferreira',
  },
  {
    id: 'nt-run',
    kind: 'run',
    title: 'Rachao perto de voce',
    text: 'Tem 3x3 marcado hoje na Quadra Municipal de Mallet.',
    time: '12 min',
    read: false,
  },
  {
    id: 'nt-story',
    kind: 'story',
    title: 'Story em destaque',
    text: 'Bruna Costa postou um treino livre para hoje.',
    time: '1 h',
    read: true,
    actor: 'Bruna Costa',
  },
];

const initialProfile: PlayerProfile = {
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
};

const viewCopy: Record<View, { eyebrow: string; title: string }> = {
  feed: {
    eyebrow: 'Timeline',
    title: 'Hoopers',
  },
  explore: {
    eyebrow: 'Descobrir',
    title: 'Atletas',
  },
  runs: {
    eyebrow: 'Jogar hoje',
    title: 'Rachoes',
  },
  direct: {
    eyebrow: 'Mensagens',
    title: 'Direct',
  },
  notifications: {
    eyebrow: 'Atividade',
    title: 'Notificacoes',
  },
  profile: {
    eyebrow: 'Minha conta',
    title: 'Perfil',
  },
};

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

function withPostImages(items: SocialPost[]) {
  return items.map((post, index) => ({
    ...post,
    imageUrl: post.imageUrl || postThumbs[index % postThumbs.length],
  }));
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<View>('feed');
  const [profile, setProfile] = useState<PlayerProfile>(initialProfile);
  const [hoopers, setHoopers] = useState<Partner[]>(mockPartners);
  const [courts, setCourts] = useState<Court[]>(mockCourts);
  const [posts, setPosts] = useState<SocialPost[]>(mockPosts);
  const [stories, setStories] = useState<Story[]>(mockStories);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [storyReply, setStoryReply] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('offline');
  const [search, setSearch] = useState('');
  const [feedTab, setFeedTab] = useState<'forYou' | 'following' | 'nearby'>('forYou');
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>(['Lucas Ferreira', 'Bruna Costa']);
  const [notifications, setNotifications] = useState<AppNotification[]>(notificationSeed);
  const [storyLikes, setStoryLikes] = useState<string[]>([]);
  const [joinedRuns, setJoinedRuns] = useState<string[]>([]);
  const [pickupRuns, setPickupRuns] = useState<PickupRun[]>(runSeed);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [runDraft, setRunDraft] = useState({
    courtId: mockCourts[0]?.id || '',
    title: '',
    time: '',
    players: '',
    notes: '',
  });
  const [runFormError, setRunFormError] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<PlayerProfile>(initialProfile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<'posts' | 'tagged'>('posts');
  const [directThreads, setDirectThreads] = useState<DirectThread[]>(directSeed);
  const [selectedDirectId, setSelectedDirectId] = useState(directSeed[0].id);
  const [directDraft, setDirectDraft] = useState('');
  const [directSearch, setDirectSearch] = useState('');
  const [storyMuted, setStoryMuted] = useState(false);
  const [storyPaused, setStoryPaused] = useState(false);

  const screen = viewCopy[activeView];
  const profileHandle = profile.username || (profile.name || 'hooper').toLowerCase().replace(/\s+/g, '.');
  const followerCount = followers.length;
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  const filteredHoopers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return hoopers;

    return hoopers.filter((hooper) =>
      `${hooper.name} ${hooper.position} ${hooper.city} ${hooper.neighborhood}`.toLowerCase().includes(term),
    );
  }, [hoopers, search]);

  const visiblePosts = useMemo(() => {
    let filteredPosts = posts;

    if (selectedTag) {
      filteredPosts = filteredPosts.filter((post) => post.tag.toLowerCase() === selectedTag.toLowerCase());
    }

    if (feedTab === 'nearby') {
      return filteredPosts.filter((post) => post.city === profile.city);
    }

    if (feedTab === 'following' && following.length) {
      return filteredPosts.filter((post) => following.includes(post.author));
    }

    return filteredPosts;
  }, [feedTab, following, posts, profile.city, selectedTag]);

  const suggestedHoopers = useMemo(() => {
    return hoopers.filter((hooper) => !following.includes(hooper.name)).slice(0, 3);
  }, [following, hoopers]);

  const profilePosts = useMemo(() => posts.slice(0, 9), [posts]);
  const selectedProfilePost = profilePosts.find((post) => post.id === selectedPostId);
  const selectedProfilePostIndex = selectedProfilePost ? profilePosts.findIndex((post) => post.id === selectedProfilePost.id) : 0;
  const selectedStory = selectedStoryId ? stories.find((story) => story.id === selectedStoryId) : null;
  const selectedStoryIndex = selectedStory ? Math.max(stories.findIndex((story) => story.id === selectedStory.id), 0) : 0;
  const selectedCourt = selectedCourtId ? courts.find((court) => court.id === selectedCourtId) : null;
  const selectedCourtRuns = selectedCourt ? pickupRuns.filter((run) => run.courtId === selectedCourt.id) : [];
  const filteredDirectThreads = useMemo(() => {
    const term = directSearch.trim().toLowerCase();
    if (!term) return directThreads;

    return directThreads.filter((thread) =>
      `${thread.name} ${thread.handle} ${thread.city} ${thread.messages.map((message) => message.text).join(' ')}`
        .toLowerCase()
        .includes(term),
    );
  }, [directSearch, directThreads]);
  const selectedDirectThread = directThreads.find((thread) => thread.id === selectedDirectId) || directThreads[0];

  const pushNotification = (notification: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    setNotifications((current) => [
      {
        ...notification,
        id: `nt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        time: 'agora',
        read: false,
      },
      ...current,
    ]);
  };

  const hydrateApp = async (incomingProfile: PlayerProfile) => {
    const data = await api.bootstrap();
    const mergedProfile = { ...data.profile, ...incomingProfile };
    setProfile(mergedProfile);
    setHoopers(data.partners);
    setCourts(data.courts);
    setPosts(withPostImages(data.posts));
    return mergedProfile;
  };

  const handleLogin = async (email: string, password: string) => {
    setApiStatus('loading');
    try {
      const auth = await api.login(email, password);
      await hydrateApp(auth.profile);
      setApiStatus('online');
      setIsAuthenticated(true);
    } catch (error) {
      setApiStatus('offline');
      throw error;
    }
  };

  const handleRegister = async (incomingProfile: PlayerProfile, email: string, password: string, username: string) => {
    setApiStatus('loading');
    try {
      const auth = await api.register(email, password, username, incomingProfile);
      const mergedProfile = await hydrateApp(auth.profile);
      api.updateProfile(mergedProfile).catch(() => setApiStatus('offline'));
      setApiStatus('online');
      setIsAuthenticated(true);
    } catch (error) {
      setApiStatus('offline');
      throw error;
    }
  };

  const handleCreatePost = async (text: string) => {
    const tagMatch = text.match(/#(\w+)/);
    const postTag = tagMatch ? tagMatch[1] : 'Basquete';
    const fallbackPost: SocialPost = {
      id: `local-${Date.now()}`,
      author: profile.name.trim() || 'Voce',
      handle: profile.username ? `@${profile.username}` : '@meu.hoops',
      role: profile.position || 'Hooper',
      city: profile.city || 'Mallet-PR',
      time: 'agora',
      text,
      tag: postTag,
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
      likes: 0,
      replies: 0,
      reposts: 0,
    };

    try {
      const created = await api.createPost({
        author: fallbackPost.author,
        handle: fallbackPost.handle,
        role: fallbackPost.role,
        city: fallbackPost.city,
        text,
        tag: postTag,
        imageUrl: fallbackPost.imageUrl,
      });
      setPosts((current) => [created, ...current]);
      setSelectedTag(postTag);
      setApiStatus('online');
    } catch {
      setPosts((current) => [fallbackPost, ...current]);
      setSelectedTag(postTag);
      setApiStatus('offline');
    }
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag.replace(/^#/, ''));
    setFeedTab('forYou');
  };
  const clearSelectedTag = () => setSelectedTag('');

  const openStory = (storyId: string) => setSelectedStoryId(storyId);
  const closeStory = () => {
    setSelectedStoryId(null);
    setStoryReply('');
    setStoryMuted(false);
    setStoryPaused(false);
  };

  const openComposer = () => {
    setActiveView('feed');
    setSelectedTag('');
  };

  const openDirect = (threadId?: string) => {
    if (threadId) setSelectedDirectId(threadId);
    setActiveView('direct');
  };

  const openTagFeed = (tag: string) => {
    setSelectedTag(tag);
    setFeedTab('forYou');
    setActiveView('feed');
  };

  const handleShareProfile = async () => {
    const text = `Conheca @${profileHandle} no Hoopers`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Hoopers', text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Sharing can be cancelled by the user.
    }
  };

  const handleCommentPost = (id: string) => {
    setPosts((current) => current.map((post) => (post.id === id ? { ...post, replies: post.replies + 1 } : post)));
    const post = posts.find((item) => item.id === id);
    pushNotification({
      kind: 'post',
      title: 'Comentario registrado',
      text: post ? `Voce entrou na conversa do post de ${post.author}.` : 'Voce entrou na conversa de um post.',
    });
  };

  const handleToggleFollow = (hooper: Partner) => {
    const isFollowing = following.includes(hooper.name);

    setFollowing((current) =>
      isFollowing ? current.filter((name) => name !== hooper.name) : [...current, hooper.name],
    );

    if (!isFollowing) {
      pushNotification({
        kind: 'follow',
        title: 'Seguindo',
        text: `Voce comecou a seguir ${hooper.name}. As postagens aparecem em Seguindo.`,
        actor: hooper.name,
      });

      if (!followers.includes(hooper.name) && hooper.city === profile.city) {
        setFollowers((current) => [...current, hooper.name]);
        pushNotification({
          kind: 'follow',
          title: 'Novo seguidor',
          text: `${hooper.name} tambem seguiu voce de volta.`,
          actor: hooper.name,
        });
      }
    }
  };

  const handleFollowBack = (name: string) => {
    const hooper = hoopers.find((item) => item.name === name);
    if (!hooper || following.includes(name)) return;
    handleToggleFollow(hooper);
  };

  const handleSendDirectMessage = () => {
    const text = directDraft.trim();
    if (!text || !selectedDirectThread) return;

    const message: DirectMessage = {
      id: `dm-${Date.now()}`,
      from: 'me',
      text,
      time: 'agora',
    };

    setDirectThreads((current) =>
      current.map((thread) =>
        thread.id === selectedDirectThread.id ? { ...thread, messages: [...thread.messages, message] } : thread,
      ),
    );
    setDirectDraft('');
  };

  const handleSendCameraMessage = () => {
    if (!selectedDirectThread) return;

    const message: DirectMessage = {
      id: `camera-${Date.now()}`,
      from: 'me',
      text: 'Enviou uma foto da quadra.',
      time: 'agora',
    };

    setDirectThreads((current) =>
      current.map((thread) =>
        thread.id === selectedDirectThread.id ? { ...thread, messages: [...thread.messages, message] } : thread,
      ),
    );
  };

  const handleSendStoryReply = () => {
    const text = storyReply.trim();
    if (!text || !selectedStory) return;

    const threadId = `story-${selectedStory.handle.replace('@', '')}`;
    const message: DirectMessage = {
      id: `story-reply-${Date.now()}`,
      from: 'me',
      text: `Respondeu ao story #${selectedStory.tag}: ${text}`,
      time: 'agora',
    };

    setDirectThreads((current) => {
      const existingThread = current.find((thread) => thread.id === threadId);
      if (existingThread) {
        return current.map((thread) =>
          thread.id === threadId ? { ...thread, messages: [...thread.messages, message], online: true } : thread,
        );
      }

      return [
        {
          id: threadId,
          name: selectedStory.author,
          handle: selectedStory.handle,
          city: selectedStory.city,
          online: true,
          messages: [
            { id: `story-context-${Date.now()}`, from: 'them', text: selectedStory.caption, time: selectedStory.time },
            message,
          ],
        },
        ...current,
      ];
    });

    setSelectedDirectId(threadId);
    setStoryReply('');
    setSelectedStoryId(null);
    setActiveView('direct');
    pushNotification({
      kind: 'story',
      title: 'Resposta enviada',
      text: `Sua resposta ao story de ${selectedStory.author} foi para o Direct.`,
      actor: selectedStory.author,
    });
  };

  const handleLikeStory = (story: Story) => {
    const liked = storyLikes.includes(story.id);
    setStoryLikes((current) => (liked ? current.filter((id) => id !== story.id) : [...current, story.id]));

    pushNotification({
      kind: 'story',
      title: liked ? 'Curtida removida' : 'Story curtido',
      text: liked ? `Voce removeu a curtida do story de ${story.author}.` : `Voce curtiu o story de ${story.author}.`,
      actor: story.author,
    });
  };

  const openCourtDetail = (courtId: string) => {
    const court = courts.find((item) => item.id === courtId);
    const wasJoined = joinedRuns.includes(courtId);
    setJoinedRuns((current) => (current.includes(courtId) ? current : [...current, courtId]));
    setSelectedCourtId(courtId);
    setActiveView('runs');
    if (!wasJoined && court) {
      pushNotification({
        kind: 'run',
        title: 'Quadra adicionada',
        text: `Voce marcou interesse em jogar na ${court.name}.`,
      });
    }
  };

  const toggleRunPresence = (runId: string) => {
    const playerName = profile.name.trim() || 'Voce';
    const targetRun = pickupRuns.find((run) => run.id === runId);
    const wasGoing = Boolean(targetRun?.going.includes(playerName));

    setPickupRuns((current) =>
      current.map((run) => {
        if (run.id !== runId) return run;
        const isGoing = run.going.includes(playerName);
        return {
          ...run,
          going: isGoing ? run.going.filter((name) => name !== playerName) : [...run.going, playerName],
        };
      }),
    );

    if (targetRun) {
      pushNotification({
        kind: 'run',
        title: wasGoing ? 'Presenca removida' : 'Presenca confirmada',
        text: wasGoing ? `Voce saiu do rachao ${targetRun.title}.` : `Voce confirmou presenca em ${targetRun.title}.`,
      });
    }
  };

  const handleCreatePickupRun = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!runDraft.courtId || !runDraft.title.trim() || !runDraft.time.trim()) {
      setRunFormError('Escolha a quadra, coloque um titulo e horario.');
      return;
    }

    const hostName = profile.name.trim() || 'Voce';
    const newRun: PickupRun = {
      id: `run-${Date.now()}`,
      courtId: runDraft.courtId,
      title: runDraft.title.trim(),
      time: runDraft.time.trim(),
      players: runDraft.players.trim() || 'Aberto',
      notes: runDraft.notes.trim() || 'Rachao criado pela comunidade.',
      host: hostName,
      going: [hostName],
    };

    setPickupRuns((current) => [newRun, ...current]);
    setSelectedCourtId(runDraft.courtId);
    setJoinedRuns((current) => (current.includes(runDraft.courtId) ? current : [...current, runDraft.courtId]));
    setRunDraft({ courtId: runDraft.courtId, title: '', time: '', players: '', notes: '' });
    setRunFormError('');
    pushNotification({
      kind: 'run',
      title: 'Rachao publicado',
      text: `${newRun.title} agora aparece para a comunidade confirmar presenca.`,
    });
  };

  const handleTogglePost = async (id: string, action: 'like' | 'repost') => {
    const targetPost = posts.find((post) => post.id === id);
    const localAction = (post: SocialPost): SocialPost => {
      if (post.id !== id) return post;
      const key = action === 'like' ? 'liked' : 'reposted';
      const count = action === 'like' ? 'likes' : 'reposts';
      const active = Boolean(post[key]);
      return { ...post, [key]: !active, [count]: post[count] + (active ? -1 : 1) };
    };

    try {
      const updated = await api.togglePost(id, action);
      setPosts((current) => current.map((post) => (post.id === id ? updated : post)));
      setApiStatus('online');
    } catch {
      setPosts((current) => current.map(localAction));
      setApiStatus('offline');
    }

    if (targetPost) {
      pushNotification({
        kind: action === 'like' ? 'like' : 'post',
        title: action === 'like' ? 'Curtida registrada' : 'Repost registrado',
        text:
          action === 'like'
            ? `Voce curtiu o post de ${targetPost.author}.`
            : `Voce repostou uma chamada de ${targetPost.author}.`,
        actor: targetPost.author,
      });
    }
  };

  const openProfileEditor = () => {
    setProfileDraft(profile);
    setProfileError('');
    setIsEditingProfile(true);
  };

  const updateProfileDraft = (field: keyof PlayerProfile, value: string) => {
    setProfileDraft((current) => ({ ...current, [field]: value }));
    setProfileError('');
  };

  const handleImageUpload = (field: 'bannerUrl' | 'avatarUrl', file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') updateProfileDraft(field, result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profileDraft.name.trim() || !profileDraft.username.trim()) {
      setProfileError('Nome e nome de usuario sao obrigatorios.');
      return;
    }

    const nextProfile = {
      ...profileDraft,
      name: profileDraft.name.trim(),
      username: profileDraft.username.trim().replace(/^@/, '').toLowerCase(),
      city: profileDraft.city.trim() || 'Mallet-PR',
    };

    setIsSavingProfile(true);
    try {
      const savedProfile = await api.updateProfile(nextProfile);
      setProfile(savedProfile);
      setApiStatus('online');
    } catch {
      setProfile(nextProfile);
      setApiStatus('offline');
    } finally {
      setIsSavingProfile(false);
      setIsEditingProfile(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mobile-app login-app">
        <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />
      </div>
    );
  }

  return (
    <div className="mobile-app social-app">
      <header className="app-header">
        <button className="brand-lockup" type="button" onClick={() => setActiveView('feed')} aria-label="Ir para o feed">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="chat" />
          </span>
          <span>
            <strong>Hoopers</strong>
            <small>{apiStatus === 'online' ? 'ao vivo no Brasil' : 'modo local'}</small>
          </span>
        </button>

        <div className="header-actions">
          <button
            type="button"
            className="icon-action notification-button"
            aria-label="Abrir notificacoes"
            onClick={() => {
              setActiveView('notifications');
              setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
            }}
          >
            <Icon name="bell" />
            {unreadNotifications > 0 && <span>{unreadNotifications}</span>}
          </button>
          <button type="button" className="icon-action" aria-label="Abrir direct" onClick={() => openDirect()}>
            <Icon name="send" />
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeView !== 'profile' && (
          <section className="screen-title social-title">
            <div>
              <p className="eyebrow">{screen.eyebrow}</p>
              <h1>{screen.title}</h1>
            </div>
            <span className="status-pill">
              {activeView === 'explore'
                ? `${filteredHoopers.length} hoopers`
                : activeView === 'runs'
                  ? `${courts.length} runs`
                  : activeView === 'direct'
                    ? `${directThreads.length} chats`
                    : activeView === 'notifications'
                      ? `${notifications.length} avisos`
                      : 'ao vivo'}
            </span>
          </section>
        )}

        {activeView === 'feed' && (
          <section className="screen-stack">
            <div className="feed-tabs" aria-label="Filtro da timeline">
              <button
                className={feedTab === 'forYou' ? 'active' : ''}
                type="button"
                onClick={() => setFeedTab('forYou')}
              >
                Pra voce
              </button>
              <button
                className={feedTab === 'following' ? 'active' : ''}
                type="button"
                onClick={() => setFeedTab('following')}
              >
                Seguindo
              </button>
              <button
                className={feedTab === 'nearby' ? 'active' : ''}
                type="button"
                onClick={() => setFeedTab('nearby')}
              >
                Perto
              </button>
            </div>

            <section className="story-rail" aria-label="Hoopers em destaque">
              {stories.slice(0, 5).map((story) => (
                <button key={story.id} type="button" onClick={() => openStory(story.id)}>
                  <span>{initials(story.author)}</span>
                  <small>{story.author.split(' ')[0]}</small>
                </button>
              ))}
            </section>

            <article className="social-prompt">
              <Icon name="court" />
              <div>
                <strong>O que ta rolando na quadra?</strong>
                <p>Poste treino, desafio, chamada para rachao ou um highlight.</p>
              </div>
            </article>

            <section className="suggestion-strip" aria-label="Sugestoes para seguir">
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Quem seguir</p>
                  <h2>Hoopers em destaque</h2>
                </div>
              </div>
              <div className="suggestion-row">
                {suggestedHoopers.map((hooper) => (
                  <article key={hooper.id} className="suggestion-card">
                    <div className="social-avatar">{initials(hooper.name)}</div>
                    <strong>{hooper.name.split(' ')[0]}</strong>
                    <span>{hooper.city}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(hooper)}
                    >
                      Seguir
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <SocialFeed
              profile={profile}
              posts={visiblePosts}
              onCreatePost={handleCreatePost}
              onTogglePost={handleTogglePost}
              onSelectTag={handleSelectTag}
              selectedTag={selectedTag}
              onClearTag={clearSelectedTag}
              onCommentPost={handleCommentPost}
            />

            {selectedStory && (
              <section className="story-viewer" role="dialog" aria-modal="true" aria-label="Story">
                <article className="story-card story-fullscreen">
                  <div className="story-card-image">
                    <img src={selectedStory.imageUrl} alt={`Story de ${selectedStory.author}`} />
                  </div>

                  <div className="story-progress" aria-hidden="true">
                    {stories.slice(0, 5).map((story, index) => (
                      <span key={story.id} className={index <= selectedStoryIndex ? 'active' : ''} />
                    ))}
                  </div>

                  <header className="story-card-head">
                    <span className="social-avatar">{initials(selectedStory.author)}</span>
                    <div>
                      <strong>{selectedStory.author}</strong>
                      <span>{selectedStory.time} - {selectedStory.city}</span>
                    </div>
                    <button
                      type="button"
                      className={storyMuted ? 'active' : ''}
                      onClick={() => setStoryMuted((current) => !current)}
                      aria-label={storyMuted ? 'Ativar som do story' : 'Silenciar story'}
                    >
                      <Icon name="volumeOff" />
                    </button>
                    <button
                      type="button"
                      className={storyPaused ? 'active' : ''}
                      onClick={() => setStoryPaused((current) => !current)}
                      aria-label={storyPaused ? 'Continuar story' : 'Pausar story'}
                    >
                      <Icon name="pause" />
                    </button>
                    <button type="button" aria-label="Mais opcoes"><Icon name="more" /></button>
                    <button type="button" onClick={closeStory} aria-label="Fechar">x</button>
                  </header>

                  <div className="story-caption">
                    <strong>#{selectedStory.tag}</strong>
                    <p>{selectedStory.caption}</p>
                  </div>

                  <form
                    className="story-reply-bar"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSendStoryReply();
                    }}
                  >
                    <input
                      value={storyReply}
                      onChange={(event) => setStoryReply(event.target.value)}
                      placeholder={`Responder a ${selectedStory.author.split(' ')[0]}...`}
                      aria-label="Responder story"
                    />
                    <button
                      type="button"
                      className={storyLikes.includes(selectedStory.id) ? 'active' : ''}
                      onClick={() => handleLikeStory(selectedStory)}
                      aria-label={storyLikes.includes(selectedStory.id) ? 'Remover curtida do story' : 'Curtir story'}
                    >
                      <Icon name="heart" />
                    </button>
                    <button type="submit" aria-label="Enviar resposta" disabled={!storyReply.trim()}>
                      <Icon name="send" />
                    </button>
                  </form>
                </article>
              </section>
            )}
          </section>
        )}

        {activeView === 'explore' && (
          <section className="screen-stack">
            <label className="side-input explore-search">
              <Icon name="search" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar atleta, cidade ou posicao"
              />
            </label>

            <div className="hooper-grid">
              {filteredHoopers.map((hooper) => (
                <article key={hooper.id} className="hooper-card">
                  <div className="social-avatar">{initials(hooper.name)}</div>
                  <div>
                    <strong>{hooper.name}</strong>
                    <span>{hooper.position} / {hooper.level}</span>
                    <p>{hooper.neighborhood}, {hooper.city}</p>
                  </div>
                  <button
                    type="button"
                    className={following.includes(hooper.name) ? 'following' : ''}
                    onClick={() => handleToggleFollow(hooper)}
                  >
                    {following.includes(hooper.name) ? 'Seguindo' : 'Seguir'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'runs' && (
          <section className="screen-stack">
            {selectedCourt ? (
              <section className="court-detail-page">
                <button type="button" className="back-row" onClick={() => setSelectedCourtId(null)}>
                  <Icon name="chevron" />
                  Voltar para rachoes
                </button>

                <article className="court-map-card">
                  <div className="court-detail-copy">
                    <p className="eyebrow">{selectedCourt.status}</p>
                    <h2>{selectedCourt.name}</h2>
                    <p>{selectedCourt.address}</p>
                  </div>

                  <div className="court-map-frame">
                    <iframe
                      title={`Mapa de ${selectedCourt.name}`}
                      src={`https://www.google.com/maps?q=${selectedCourt.lat},${selectedCourt.lng}&z=16&output=embed`}
                      loading="lazy"
                    />
                  </div>

                  <div className="court-map-actions">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedCourt.lat},${selectedCourt.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon name="map" />
                      Abrir rota
                    </a>
                    <button
                      type="button"
                      className={joinedRuns.includes(selectedCourt.id) ? 'following' : ''}
                      onClick={() =>
                        setJoinedRuns((current) =>
                          current.includes(selectedCourt.id)
                            ? current.filter((id) => id !== selectedCourt.id)
                            : [...current, selectedCourt.id],
                        )
                      }
                    >
                      {joinedRuns.includes(selectedCourt.id) ? 'Voce vai' : 'Participar'}
                    </button>
                  </div>
                </article>

                <section className="pickup-board" aria-label="Rachoes nesta quadra">
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Nesta quadra</p>
                      <h2>Rachoes marcados</h2>
                    </div>
                  </div>

                  {selectedCourtRuns.length ? (
                    selectedCourtRuns.map((run) => (
                      <article key={run.id} className="pickup-card">
                        <div>
                          <span>{run.time}</span>
                          <strong>{run.title}</strong>
                          <p>{run.notes}</p>
                        </div>
                        <dl>
                          <div>
                            <dt>Host</dt>
                            <dd>{run.host}</dd>
                          </div>
                          <div>
                            <dt>Confirmados</dt>
                            <dd>{run.going.length}</dd>
                          </div>
                        </dl>
                        <button
                          type="button"
                          className={run.going.includes(profile.name.trim() || 'Voce') ? 'following' : ''}
                          onClick={() => toggleRunPresence(run.id)}
                        >
                          {run.going.includes(profile.name.trim() || 'Voce') ? 'Estou dentro' : 'Vou participar'}
                        </button>
                      </article>
                    ))
                  ) : (
                    <p className="empty-state">Ainda nao tem rachao marcado aqui. Crie o primeiro chamado para essa quadra.</p>
                  )}
                </section>
              </section>
            ) : (
              <>
                <article className="metric-card accent">
                  <Icon name="time" />
                  <span>Chamada aberta</span>
                  <strong>Monte um rachao perto de voce.</strong>
                  <p>Crie uma chamada com local, horario e quantidade de jogadores para a comunidade confirmar presenca.</p>
                </article>

                <form className="run-create-card" onSubmit={handleCreatePickupRun}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Criar rachao</p>
                      <h2>Chamar a galera</h2>
                    </div>
                  </div>

                  <label className="field">
                    <span>Quadra</span>
                    <select
                      value={runDraft.courtId}
                      onChange={(event) => {
                        setRunDraft((current) => ({ ...current, courtId: event.target.value }));
                        setRunFormError('');
                      }}
                    >
                      {courts.map((court) => (
                        <option key={court.id} value={court.id}>{court.name}</option>
                      ))}
                    </select>
                  </label>

                  <div className="run-create-grid">
                    <label className="field">
                      <span>Titulo</span>
                      <input
                        value={runDraft.title}
                        onChange={(event) => {
                          setRunDraft((current) => ({ ...current, title: event.target.value }));
                          setRunFormError('');
                        }}
                        placeholder="3x3 no Centro"
                      />
                    </label>
                    <label className="field">
                      <span>Horario</span>
                      <input
                        value={runDraft.time}
                        onChange={(event) => {
                          setRunDraft((current) => ({ ...current, time: event.target.value }));
                          setRunFormError('');
                        }}
                        placeholder="Hoje, 20:00"
                      />
                    </label>
                  </div>

                  <label className="field">
                    <span>Jogadores</span>
                    <input
                      value={runDraft.players}
                      onChange={(event) => setRunDraft((current) => ({ ...current, players: event.target.value }))}
                      placeholder="Faltam 2, aberto, 5x5..."
                    />
                  </label>

                  <label className="field">
                    <span>Recado</span>
                    <textarea
                      value={runDraft.notes}
                      onChange={(event) => setRunDraft((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Nivel, regras, levar bola, valor..."
                    />
                  </label>

                  {runFormError && <p className="profile-edit-error">{runFormError}</p>}

                  <button type="submit" className="profile-save-button">Postar rachao</button>
                </form>

                <section className="pickup-board" aria-label="Rachoes postados">
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Confirmar presenca</p>
                      <h2>Chamadas abertas</h2>
                    </div>
                  </div>

                  {pickupRuns.map((run) => {
                    const court = courts.find((item) => item.id === run.courtId);
                    return (
                      <article key={run.id} className="pickup-card">
                        <div>
                          <span>{run.time} - {court?.address || 'Brasil'}</span>
                          <strong>{run.title}</strong>
                          <p>{run.notes}</p>
                        </div>
                        <dl>
                          <div>
                            <dt>Jogadores</dt>
                            <dd>{run.players}</dd>
                          </div>
                          <div>
                            <dt>Confirmados</dt>
                            <dd>{run.going.length}</dd>
                          </div>
                        </dl>
                        <div className="pickup-actions">
                          <button type="button" onClick={() => court && openCourtDetail(court.id)}>
                            Ver quadra
                          </button>
                          <button
                            type="button"
                            className={run.going.includes(profile.name.trim() || 'Voce') ? 'following' : ''}
                            onClick={() => toggleRunPresence(run.id)}
                          >
                            {run.going.includes(profile.name.trim() || 'Voce') ? 'Estou dentro' : 'Vou participar'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>

                <div className="run-list">
                  {courts.map((court) => (
                    <article key={court.id} className="run-card">
                      <div>
                        <span>{court.status}</span>
                        <strong>{court.name}</strong>
                        <p>{court.address}</p>
                      </div>
                      <dl>
                        <div>
                          <dt>Preco</dt>
                          <dd>{court.price}</dd>
                        </div>
                        <div>
                          <dt>Piso</dt>
                          <dd>{court.surface}</dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        className={joinedRuns.includes(court.id) ? 'following' : ''}
                        onClick={() => openCourtDetail(court.id)}
                      >
                        {joinedRuns.includes(court.id) ? 'Ver mapa' : 'Participar'}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {activeView === 'direct' && (
          <section className="screen-stack direct-screen">
            <label className="direct-search" aria-label="Buscar conversas">
              <Icon name="search" />
              <input
                value={directSearch}
                onChange={(event) => setDirectSearch(event.target.value)}
                placeholder="Buscar hoopers ou mensagens"
              />
            </label>

            <section className="direct-list" aria-label="Conversas">
              {filteredDirectThreads.map((thread) => {
                const lastMessage = thread.messages[thread.messages.length - 1];

                return (
                  <button
                    key={thread.id}
                    type="button"
                    className={`direct-thread${thread.id === selectedDirectThread.id ? ' active' : ''}`}
                    onClick={() => setSelectedDirectId(thread.id)}
                  >
                    <span className="direct-avatar">
                      {initials(thread.name)}
                      {thread.online && <i aria-hidden="true" />}
                    </span>
                    <span>
                      <strong>{thread.name}</strong>
                      <small>{lastMessage?.text || thread.city}</small>
                    </span>
                    <em>{lastMessage?.time || 'agora'}</em>
                  </button>
                );
              })}
            </section>

            {selectedDirectThread && (
              <section className="direct-chat" aria-label={`Chat com ${selectedDirectThread.name}`}>
                <header className="direct-chat-head">
                  <span className="direct-avatar">
                    {initials(selectedDirectThread.name)}
                    {selectedDirectThread.online && <i aria-hidden="true" />}
                  </span>
                  <div>
                    <strong>{selectedDirectThread.name}</strong>
                    <p>{selectedDirectThread.online ? 'online agora' : selectedDirectThread.city}</p>
                  </div>
                </header>

                <div className="direct-messages">
                  {selectedDirectThread.messages.map((message) => (
                    <p key={message.id} className={`direct-message ${message.from}`}>
                      <span>{message.text}</span>
                      <small>{message.time}</small>
                    </p>
                  ))}
                </div>

                <form
                  className="direct-composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSendDirectMessage();
                  }}
                >
                  <button type="button" onClick={handleSendCameraMessage} aria-label="Enviar foto">
                    <Icon name="camera" />
                  </button>
                  <input
                    value={directDraft}
                    onChange={(event) => setDirectDraft(event.target.value)}
                    placeholder={`Mensagem para ${selectedDirectThread.name.split(' ')[0]}`}
                  />
                  <button type="submit" disabled={!directDraft.trim()} aria-label="Enviar mensagem">
                    <Icon name="send" />
                  </button>
                </form>
              </section>
            )}
          </section>
        )}

        {activeView === 'notifications' && (
          <section className="screen-stack notifications-screen">
            <section className="notification-summary">
              <article>
                <span>{followers.length}</span>
                <strong>seguidores</strong>
              </article>
              <article>
                <span>{following.length}</span>
                <strong>seguindo</strong>
              </article>
              <article>
                <span>{storyLikes.length}</span>
                <strong>stories curtidos</strong>
              </article>
            </section>

            <section className="followers-card">
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Conexoes</p>
                  <h2>Quem segue voce</h2>
                </div>
              </div>

              {followers.map((name) => {
                const hooper = hoopers.find((item) => item.name === name);
                const followsBack = following.includes(name);

                return (
                  <article key={name} className="follower-row">
                    <span className="social-avatar">{initials(name)}</span>
                    <div>
                      <strong>{name}</strong>
                      <small>{hooper ? `${hooper.position} - ${hooper.city}` : 'Hooper'}</small>
                    </div>
                    <button type="button" className={followsBack ? 'following' : ''} onClick={() => handleFollowBack(name)}>
                      {followsBack ? 'Seguindo' : 'Seguir de volta'}
                    </button>
                  </article>
                );
              })}
            </section>

            <section className="notification-list-card">
              <div className="notification-list-head">
                <div>
                  <p className="eyebrow">Hoje</p>
                  <h2>Atividade</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))}
                >
                  Marcar lidas
                </button>
              </div>

              <div className="notification-list">
                {notifications.map((notification) => (
                  <article key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                    <span className={`notification-kind ${notification.kind}`}>
                      <Icon
                        name={
                          notification.kind === 'follow'
                            ? 'person'
                            : notification.kind === 'like' || notification.kind === 'story'
                              ? 'heart'
                              : notification.kind === 'run'
                                ? 'court'
                                : 'bell'
                        }
                      />
                    </span>
                    <div>
                      <strong>{notification.title}</strong>
                      <p>{notification.text}</p>
                      <small>{notification.time}</small>
                    </div>
                    {!notification.read && <i aria-label="Nao lida" />}
                  </article>
                ))}
              </div>
            </section>
          </section>
        )}

        {activeView === 'profile' && (
          <section className="screen-stack instagram-profile">
            <header className="profile-topbar">
              <button type="button" onClick={openProfileEditor} aria-label="Editar usuario">
                @{profileHandle}
                <Icon name="chevron" />
              </button>
              <div>
                <span className="profile-live-dot" title={apiStatus === 'online' ? 'Online' : 'Modo local'} />
                <button type="button" aria-label="Abrir direct" onClick={() => openDirect()}>
                  <Icon name="send" />
                </button>
              </div>
            </header>

            <section className="profile-summary" aria-label="Resumo do perfil">
              <div className="profile-avatar-ring">
                <span className="profile-avatar instagram-avatar">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={`${profile.name || 'Perfil'} avatar`} />
                  ) : (
                    initials(profile.name || 'Hooper')
                  )}
                </span>
              </div>

              <div className="profile-counts">
                <span><b>{posts.length}</b> posts</span>
                <span><b>{followerCount}</b> seguidores</span>
                <span><b>{following.length}</b> seguindo</span>
              </div>
            </section>

            <section className="profile-instagram-bio">
              <strong>{profile.name || 'Seu nome'}</strong>
              <p>{profile.position} / {profile.level}</p>
              <p>{profile.city} - procurando rachoes, treinos e conexoes no basket.</p>
              {profile.characteristics && <p>{profile.characteristics}</p>}
              {profile.availability && <span>{profile.availability}</span>}
            </section>

            <section className="profile-actions">
              <button type="button" onClick={openProfileEditor}>Editar perfil</button>
              <button type="button" onClick={handleShareProfile}>Compartilhar</button>
            </section>

            {isEditingProfile && (
              <form className="profile-edit-card" onSubmit={handleSaveProfile}>
                <div className="profile-edit-head">
                  <div>
                    <p className="eyebrow">Editar perfil</p>
                    <h2>Dados do atleta</h2>
                  </div>
                  <button type="button" onClick={() => setIsEditingProfile(false)}>Cancelar</button>
                </div>

                <div className="profile-image-preview">
                  <div className={`profile-cover-preview${profileDraft.bannerUrl ? ' has-cover' : ''}`}>
                    {profileDraft.bannerUrl && (
                      <img className="profile-cover-image" src={profileDraft.bannerUrl} alt="Banner do perfil" />
                    )}
                    <span className="profile-avatar preview-avatar">
                      {profileDraft.avatarUrl ? (
                        <img src={profileDraft.avatarUrl} alt="Avatar preview" />
                      ) : (
                        initials(profileDraft.name || 'Hooper')
                      )}
                    </span>
                  </div>
                  <p className="small-meta">Cole URLs de imagem para banner e avatar para atualizar a aparencia do perfil.</p>
                </div>

                <div className="profile-edit-grid two">
                  <label className="field">
                    <span>Banner do perfil</span>
                    <div className="image-input-row">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => event.target.files?.[0] && handleImageUpload('bannerUrl', event.target.files[0])}
                      />
                      <span>ou URL</span>
                    </div>
                    <input
                      value={(profileDraft.bannerUrl?.startsWith('data:')) ? '' : (profileDraft.bannerUrl || '')}
                      onChange={(event) => !event.target.value.startsWith('data:') && updateProfileDraft('bannerUrl', event.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                  <label className="field">
                    <span>Foto do perfil</span>
                    <div className="image-input-row">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => event.target.files?.[0] && handleImageUpload('avatarUrl', event.target.files[0])}
                      />
                      <span>ou URL</span>
                    </div>
                    <input
                      value={(profileDraft.avatarUrl?.startsWith('data:')) ? '' : (profileDraft.avatarUrl || '')}
                      onChange={(event) => !event.target.value.startsWith('data:') && updateProfileDraft('avatarUrl', event.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Nome</span>
                  <input value={profileDraft.name} onChange={(event) => updateProfileDraft('name', event.target.value)} />
                </label>

                <label className="field">
                  <span>Nome de usuario</span>
                  <input value={profileDraft.username} onChange={(event) => updateProfileDraft('username', event.target.value)} />
                </label>

                <label className="field">
                  <span>Cidade</span>
                  <input value={profileDraft.city} onChange={(event) => updateProfileDraft('city', event.target.value)} />
                </label>

                <div className="profile-edit-grid">
                  <label className="field">
                    <span>Idade</span>
                    <input
                      inputMode="numeric"
                      value={profileDraft.age}
                      onChange={(event) => updateProfileDraft('age', event.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Altura</span>
                    <input value={profileDraft.height} onChange={(event) => updateProfileDraft('height', event.target.value)} />
                  </label>

                  <label className="field">
                    <span>Peso</span>
                    <input value={profileDraft.weight} onChange={(event) => updateProfileDraft('weight', event.target.value)} />
                  </label>
                </div>

                <div className="profile-edit-grid two">
                  <label className="field">
                    <span>Posicao</span>
                    <select value={profileDraft.position} onChange={(event) => updateProfileDraft('position', event.target.value)}>
                      {positions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Nivel</span>
                    <select value={profileDraft.level} onChange={(event) => updateProfileDraft('level', event.target.value)}>
                      {levels.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span>Disponibilidade</span>
                  <input
                    value={profileDraft.availability}
                    onChange={(event) => updateProfileDraft('availability', event.target.value)}
                    placeholder="Noites, sabados, domingos..."
                  />
                </label>

                <label className="field">
                  <span>Caracteristicas</span>
                  <textarea
                    value={profileDraft.characteristics}
                    onChange={(event) => updateProfileDraft('characteristics', event.target.value)}
                    placeholder="Arremesso, defesa, velocidade..."
                  />
                </label>

                <label className="field">
                  <span>Historia no basket</span>
                  <textarea
                    value={profileDraft.history}
                    onChange={(event) => updateProfileDraft('history', event.target.value)}
                    placeholder="Conte sua caminhada nas quadras"
                  />
                </label>

                {profileError && <p className="profile-edit-error">{profileError}</p>}

                <button className="profile-save-button" type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Salvando...' : 'Salvar perfil'}
                </button>
              </form>
            )}

            <section className="profile-highlights" aria-label="Destaques do perfil">
              <button type="button" onClick={() => setActiveView('runs')}>
                <span><Icon name="court" /></span>
                <small>Rachoes</small>
              </button>
              <button type="button" onClick={() => openTagFeed('TreinoLivre')}>
                <span><Icon name="trophy" /></span>
                <small>Highlights</small>
              </button>
              <button type="button" onClick={() => openTagFeed('MalletPR')}>
                <span><Icon name="heart" /></span>
                <small>Favoritos</small>
              </button>
              <button type="button" onClick={() => openTagFeed('Basquete')}>
                <span><Icon name="star" /></span>
                <small>Treinos</small>
              </button>
            </section>

            <section className="profile-tabs" aria-label="Conteudo do perfil">
              <button
                type="button"
                className={profileTab === 'posts' ? 'active' : ''}
                onClick={() => setProfileTab('posts')}
                aria-label="Publicacoes"
              >
                <Icon name="court" />
              </button>
              <button
                type="button"
                className={profileTab === 'tagged' ? 'active' : ''}
                onClick={() => setProfileTab('tagged')}
                aria-label="Marcados"
              >
                <Icon name="person" />
              </button>
            </section>

            {profileTab === 'posts' ? (
              <section className="profile-post-grid">
                {profilePosts.map((post, index) => (
                  <button
                    key={post.id}
                    type="button"
                    className="profile-post-tile"
                    onClick={() => setSelectedPostId(post.id)}
                    aria-label={`Abrir post ${post.tag}`}
                  >
                    <img src={post.imageUrl || postThumbs[index % postThumbs.length]} alt={`Post ${post.tag}`} />
                    <span className="post-tile-tag">#{post.tag}</span>
                    <span className="post-tile-overlay">
                      <span><Icon name="heart" /> {post.likes}</span>
                      <span><Icon name="chat" /> {post.replies}</span>
                    </span>
                  </button>
                ))}
              </section>
            ) : (
              <article className="profile-empty-grid">
                <Icon name="person" />
                <strong>Nenhuma marcacao ainda</strong>
                <p>Quando outro hooper marcar voce em um post, ele aparece aqui.</p>
              </article>
            )}

            {selectedProfilePost && (
              <section className="post-viewer" role="dialog" aria-modal="true" aria-label="Post">
                <button className="post-viewer-backdrop" type="button" onClick={() => setSelectedPostId(null)} aria-label="Fechar post"></button>
                <article className="post-viewer-card">
                  <header className="post-viewer-head">
                    <span className="social-avatar">
                      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials(profile.name || 'Hooper')}
                    </span>
                    <div>
                      <strong>@{profileHandle}</strong>
                      <p>{selectedProfilePost.city}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedPostId(null)} aria-label="Fechar">x</button>
                  </header>

                  <div className="post-viewer-media">
                    <img
                      src={selectedProfilePost.imageUrl || postThumbs[selectedProfilePostIndex % postThumbs.length]}
                      alt={`Imagem do post ${selectedProfilePost.tag}`}
                    />
                    <span>#{selectedProfilePost.tag}</span>
                  </div>

                  <div className="post-viewer-body">
                    <div className="post-viewer-actions">
                      <button type="button" onClick={() => handleTogglePost(selectedProfilePost.id, 'like')} aria-label="Curtir">
                        <Icon name="heart" />
                      </button>
                      <button type="button" onClick={() => handleCommentPost(selectedProfilePost.id)} aria-label="Comentar">
                        <Icon name="chat" />
                      </button>
                      <button type="button" onClick={() => handleTogglePost(selectedProfilePost.id, 'repost')} aria-label="Repostar">
                        <Icon name="repeat" />
                      </button>
                    </div>
                    <strong>{selectedProfilePost.likes} curtidas</strong>
                    <p><b>{profileHandle}</b> {selectedProfilePost.text}</p>
                    <small>Ver todos os {selectedProfilePost.replies} comentarios</small>
                  </div>
                </article>
              </section>
            )}
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Navegacao principal">
        <button className={activeView === 'feed' ? 'active' : ''} type="button" onClick={() => setActiveView('feed')}>
          <Icon name="chat" />
          <span>Feed</span>
        </button>
        <button className={activeView === 'explore' ? 'active' : ''} type="button" onClick={() => setActiveView('explore')}>
          <Icon name="search" />
          <span>Explorar</span>
        </button>
        <button className={activeView === 'runs' ? 'active' : ''} type="button" onClick={() => setActiveView('runs')}>
          <Icon name="court" />
          <span>Rachoes</span>
        </button>
        <button className={activeView === 'direct' ? 'active' : ''} type="button" onClick={() => openDirect()}>
          <Icon name="send" />
          <span>Direct</span>
        </button>
        <button className={activeView === 'profile' ? 'active' : ''} type="button" onClick={() => setActiveView('profile')}>
          <Icon name="person" />
          <span>Perfil</span>
        </button>
      </nav>

      {activeView !== 'profile' && (
        <button type="button" className="floating-compose" onClick={() => setActiveView('feed')} aria-label="Criar post">
          <Icon name="chat" />
        </button>
      )}
    </div>
  );
}

export default App;
