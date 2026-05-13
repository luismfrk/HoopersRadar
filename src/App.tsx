import { FormEvent, useMemo, useState } from 'react';
import { api } from './api';
import BrandLogo from './components/BrandLogo';
import Icon from './components/Icon';
import LoginScreen from './components/LoginScreen';
import SocialFeed from './components/SocialFeed';
import { mockCourts } from './data/mockData';
import { Court, Partner, PlayerProfile, SocialPost, Story } from './types';

type View = 'feed' | 'explore' | 'runs' | 'direct' | 'notifications' | 'profile';
type GameDateFilter = 'today' | 'tomorrow' | 'all';
type GameTimeFilter = 'any' | 'morning' | 'afternoon' | 'night';
type GameLocationFilter = 'profile' | 'all';
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

type PostComment = {
  id: string;
  author: string;
  handle: string;
  text: string;
  time: string;
};

const positions = ['Armador', 'Ala-armador', 'Ala', 'Ala-pivo', 'Pivo'];
const levels = ['Recreativo', 'Intermediario', 'Competitivo'];
const postThumbs = [
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1627627256672-027a4613d028?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?auto=format&fit=crop&w=500&q=80',
];

const directSeed: DirectThread[] = [];

const runSeed: PickupRun[] = [];

const notificationSeed: AppNotification[] = [];

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
  rankingPoints: 0,
};

const viewCopy: Record<View, { eyebrow: string; title: string }> = {
  feed: {
    eyebrow: 'Conecte. Compita. Evolua.',
    title: 'Hoopers Radar',
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
  const [hoopers, setHoopers] = useState<Partner[]>([]);
  const [courts, setCourts] = useState<Court[]>(mockCourts);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [storyReply, setStoryReply] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('offline');
  const [search, setSearch] = useState('');
  const [feedTab, setFeedTab] = useState<'forYou' | 'following' | 'nearby'>('forYou');
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
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
  const [selectedCommentPostId, setSelectedCommentPostId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [postComments, setPostComments] = useState<Record<string, PostComment[]>>({});
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerImageUrl, setComposerImageUrl] = useState('');
  const [profileTab, setProfileTab] = useState<'posts' | 'reels' | 'saved' | 'tagged'>('posts');
  const [directThreads, setDirectThreads] = useState<DirectThread[]>(directSeed);
  const [selectedDirectId, setSelectedDirectId] = useState(directSeed[0]?.id || '');
  const [directDraft, setDirectDraft] = useState('');
  const [directSearch, setDirectSearch] = useState('');
  const [storyMuted, setStoryMuted] = useState(false);
  const [storyPaused, setStoryPaused] = useState(false);
  const [rankingTab, setRankingTab] = useState<'geral' | 'regional' | 'seguindo' | 'amigos'>('geral');
  const [gamesTab, setGamesTab] = useState<'upcoming' | 'mine' | 'saved'>('upcoming');
  const [savedRunIds, setSavedRunIds] = useState<string[]>([]);
  const [isRunFormOpen, setIsRunFormOpen] = useState(false);
  const [gameDateFilter, setGameDateFilter] = useState<GameDateFilter>('today');
  const [gameTimeFilter, setGameTimeFilter] = useState<GameTimeFilter>('any');
  const [gameLocationFilter, setGameLocationFilter] = useState<GameLocationFilter>('profile');
  const [gameCourtFilter, setGameCourtFilter] = useState('');
  const [scoreDraft, setScoreDraft] = useState('');
  const [scoreReason, setScoreReason] = useState('Partida jogada');

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

    if (feedTab === 'following') {
      return filteredPosts.filter((post) => following.includes(post.author));
    }

    return filteredPosts;
  }, [feedTab, following, posts, profile.city, selectedTag]);

  const suggestedHoopers = useMemo(() => {
    return hoopers.filter((hooper) => !following.includes(hooper.name)).slice(0, 3);
  }, [following, hoopers]);

  const profilePosts = useMemo(
    () =>
      posts
        .filter((post) => post.author === profile.name || post.handle === `@${profileHandle}`)
        .slice(0, 9),
    [posts, profile.name, profileHandle],
  );
  const savedProfilePosts = useMemo(() => posts.filter((post) => savedPostIds.includes(post.id)).slice(0, 9), [posts, savedPostIds]);
  const visibleProfileGridPosts = profileTab === 'saved' ? savedProfilePosts : profilePosts;
  const selectedProfilePost = profilePosts.find((post) => post.id === selectedPostId);
  const selectedProfilePostIndex = selectedProfilePost ? profilePosts.findIndex((post) => post.id === selectedProfilePost.id) : 0;
  const selectedCommentPost = selectedCommentPostId ? posts.find((post) => post.id === selectedCommentPostId) : null;
  const selectedComments = selectedCommentPostId ? postComments[selectedCommentPostId] || [] : [];
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
  const profileRunCount = pickupRuns.filter((run) => run.host === (profile.name.trim() || 'Voce')).length;
  const automaticPoints = profilePosts.length * 80 + joinedRuns.length * 120 + profileRunCount * 160 + savedPostIds.length * 20;
  const manualRankingPoints = Number(profile.rankingPoints || 0);
  const activityPoints = automaticPoints + manualRankingPoints;
  const currentRank = activityPoints >= 2000 ? 'All-Star' : activityPoints >= 1000 ? 'Starter' : activityPoints >= 400 ? 'Sixth Man' : 'Rookie';
  const nextRank = activityPoints >= 2000 ? 'MVP' : activityPoints >= 1000 ? 'All-Star' : activityPoints >= 400 ? 'Starter' : 'Sixth Man';
  const nextRankPoints = activityPoints >= 2000 ? 3200 : activityPoints >= 1000 ? 2000 : activityPoints >= 400 ? 1000 : 400;
  const rankProgress = Math.min(100, Math.round((activityPoints / nextRankPoints) * 100));
  const runMatchesDate = (run: PickupRun) => {
    const normalized = run.time.toLowerCase();
    if (gameDateFilter === 'today') return normalized.includes('hoje');
    if (gameDateFilter === 'tomorrow') return normalized.includes('amanha') || normalized.includes('amanhã');
    return true;
  };
  const runMatchesTime = (run: PickupRun) => {
    if (gameTimeFilter === 'any') return true;
    const hourMatch = run.time.match(/(\d{1,2})(?::\d{2})?/);
    if (!hourMatch) return true;
    const hour = Number(hourMatch[1]);
    if (gameTimeFilter === 'morning') return hour >= 5 && hour < 12;
    if (gameTimeFilter === 'afternoon') return hour >= 12 && hour < 18;
    return hour >= 18 || hour < 5;
  };
  const visibleRuns = useMemo(() => {
    const playerName = profile.name.trim() || 'Voce';
    const term = search.trim().toLowerCase();

    return pickupRuns.filter((run) => {
      const court = courts.find((item) => item.id === run.courtId);
      const isMine = run.host === playerName || run.going.includes(playerName);
      const isSaved = savedRunIds.includes(run.id);
      const tabMatch = gamesTab === 'mine' ? isMine : gamesTab === 'saved' ? isSaved : true;
      const dateMatch = runMatchesDate(run);
      const timeMatch = runMatchesTime(run);
      const courtMatch = gameCourtFilter ? run.courtId === gameCourtFilter : true;
      const locationMatch =
        gameLocationFilter === 'all' ? true : (court?.address || '').toLowerCase().includes((profile.city || '').toLowerCase());
      const searchMatch = term
        ? `${run.title} ${run.time} ${run.players} ${run.notes} ${run.host} ${court?.name || ''} ${court?.address || ''}`
            .toLowerCase()
            .includes(term)
        : true;

      return tabMatch && dateMatch && timeMatch && courtMatch && locationMatch && searchMatch;
    });
  }, [courts, gameCourtFilter, gameDateFilter, gameLocationFilter, gameTimeFilter, gamesTab, pickupRuns, profile.city, profile.name, savedRunIds, search]);
  const gameDateLabel = gameDateFilter === 'today' ? 'Hoje' : gameDateFilter === 'tomorrow' ? 'Amanha' : 'Todos';
  const gameTimeLabel =
    gameTimeFilter === 'any' ? 'Qualquer' : gameTimeFilter === 'morning' ? 'Manha' : gameTimeFilter === 'afternoon' ? 'Tarde' : 'Noite';
  const gameLocationLabel = gameLocationFilter === 'profile' ? profile.city || 'Minha cidade' : 'Todos';
  const gameCourtLabel = gameCourtFilter ? courts.find((court) => court.id === gameCourtFilter)?.name || 'Quadra' : `${courts.length}`;
  const hasGameFilters =
    gameDateFilter !== 'all' || gameTimeFilter !== 'any' || gameLocationFilter !== 'all' || Boolean(gameCourtFilter) || Boolean(search.trim());

  const cycleGameDateFilter = () => {
    setGameDateFilter((current) => (current === 'today' ? 'tomorrow' : current === 'tomorrow' ? 'all' : 'today'));
  };

  const cycleGameTimeFilter = () => {
    setGameTimeFilter((current) =>
      current === 'any' ? 'morning' : current === 'morning' ? 'afternoon' : current === 'afternoon' ? 'night' : 'any',
    );
  };

  const cycleGameLocationFilter = () => {
    setGameLocationFilter((current) => (current === 'profile' ? 'all' : 'profile'));
  };

  const cycleGameCourtFilter = () => {
    setGameCourtFilter((current) => {
      if (!courts.length) return '';
      if (!current) return courts[0].id;
      const index = courts.findIndex((court) => court.id === current);
      return index >= 0 && index < courts.length - 1 ? courts[index + 1].id : '';
    });
  };

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

  const handleCreatePost = async (text: string, imageUrl?: string) => {
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
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
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
    setIsComposerOpen(true);
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

  const handleShareRanking = async () => {
    const text = `Meu ranking no Hoopers Radar: @${profileHandle}, ${currentRank}, ${activityPoints.toLocaleString('pt-BR')} pts.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ranking Hoopers Radar', text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      pushNotification({
        kind: 'system',
        title: 'Ranking compartilhado',
        text: 'O resumo do seu ranking foi preparado para envio.',
      });
    } catch {
      // Sharing can be cancelled by the user.
    }
  };

  const handleAddRankingPoints = async (points: number, reason = scoreReason) => {
    const cleanPoints = Math.max(0, Math.round(points));
    if (!cleanPoints) return;

    const nextProfile = {
      ...profile,
      rankingPoints: manualRankingPoints + cleanPoints,
    };

    setProfile(nextProfile);
    setScoreDraft('');
    pushNotification({
      kind: 'system',
      title: 'Pontuacao adicionada',
      text: `${cleanPoints.toLocaleString('pt-BR')} pts por ${reason.toLowerCase()}.`,
    });

    try {
      await api.updateProfile(nextProfile);
      setApiStatus('online');
    } catch {
      setApiStatus('offline');
    }
  };

  const handleSubmitRankingPoints = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleAddRankingPoints(Number(scoreDraft.replace(',', '.')));
  };

  const handleCommentPost = (id: string) => {
    setSelectedCommentPostId(id);
    setCommentDraft('');
  };

  const handleSubmitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCommentPostId || !commentDraft.trim()) return;

    const comment: PostComment = {
      id: `comment-${Date.now()}`,
      author: profile.name.trim() || 'Voce',
      handle: profile.username ? `@${profile.username}` : '@meu.hoops',
      text: commentDraft.trim(),
      time: 'agora',
    };

    setPostComments((current) => ({
      ...current,
      [selectedCommentPostId]: [...(current[selectedCommentPostId] || []), comment],
    }));
    setPosts((current) =>
      current.map((post) => (post.id === selectedCommentPostId ? { ...post, replies: post.replies + 1 } : post)),
    );
    setCommentDraft('');

    const post = posts.find((item) => item.id === selectedCommentPostId);
    pushNotification({
      kind: 'post',
      title: 'Comentario registrado',
      text: post ? `Voce comentou no post de ${post.author}.` : 'Voce comentou em um post.',
    });
  };

  const handleSavePost = (id: string) => {
    const isSaved = savedPostIds.includes(id);
    setSavedPostIds((current) => (isSaved ? current.filter((item) => item !== id) : [...current, id]));
    const post = posts.find((item) => item.id === id);
    pushNotification({
      kind: 'post',
      title: isSaved ? 'Post removido dos salvos' : 'Post salvo',
      text: post ? `${post.author}: ${post.text.slice(0, 54)}` : 'Sua colecao foi atualizada.',
    });
  };

  const handleSharePost = async (id: string) => {
    const post = posts.find((item) => item.id === id);
    if (!post) return;

    const text = `${post.author} no Hoopers Radar: ${post.text}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Hoopers Radar', text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      pushNotification({
        kind: 'post',
        title: 'Post pronto para compartilhar',
        text: 'O conteudo foi enviado para o compartilhamento do dispositivo.',
      });
    } catch {
      // Sharing can be cancelled by the user.
    }
  };

  const handleSaveRun = (runId: string) => {
    const run = pickupRuns.find((item) => item.id === runId);
    const isSaved = savedRunIds.includes(runId);
    setSavedRunIds((current) => (isSaved ? current.filter((id) => id !== runId) : [...current, runId]));
    if (run) {
      pushNotification({
        kind: 'run',
        title: isSaved ? 'Jogo removido dos favoritos' : 'Jogo salvo',
        text: `${run.title} ${isSaved ? 'saiu dos favoritos.' : 'foi guardado nos favoritos.'}`,
      });
    }
  };

  const handleSubmitComposer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!composerText.trim()) return;

    await handleCreatePost(composerText.trim(), composerImageUrl.trim() || undefined);
    setComposerText('');
    setComposerImageUrl('');
    setIsComposerOpen(false);
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

  const handleShareStory = async (story: Story) => {
    const text = `${story.author} no Hoopers Radar: ${story.caption}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Story Hoopers Radar', text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      pushNotification({
        kind: 'story',
        title: 'Story pronto para compartilhar',
        text: 'O conteudo foi enviado para o compartilhamento do dispositivo.',
        actor: story.author,
      });
    } catch {
      // Sharing can be cancelled by the user.
    }
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
    setGamesTab('upcoming');
    setIsRunFormOpen(false);
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
      <div className="phone-status" aria-hidden="true">
        <span>9:41</span>
        <span className="phone-indicators">
          <i />
          <i />
          <i />
        </span>
      </div>
      {activeView !== 'profile' && activeView !== 'runs' && activeView !== 'explore' && (
      <header className="app-header">
        <button className="brand-lockup" type="button" onClick={() => setActiveView('feed')} aria-label="Ir para o feed">
          <BrandLogo compact status={apiStatus === 'online' ? 'ao vivo no Brasil' : 'modo local'} />
        </button>

        <div className="header-actions">
          <button
            type="button"
            className="icon-action add-button"
            aria-label="Criar post"
            onClick={openComposer}
          >
            <Icon name="plus" />
          </button>
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
        </div>
      </header>
      )}

      <main className="app-main">
        {activeView !== 'profile' && activeView !== 'feed' && activeView !== 'runs' && activeView !== 'explore' && (
          <section className="screen-title social-title">
            <div>
              <p className="eyebrow">{screen.eyebrow}</p>
              <h1>{screen.title}</h1>
            </div>
            <span className="status-pill">
              {activeView === 'direct'
                ? `${directThreads.length} chats`
                : activeView === 'notifications'
                  ? `${notifications.length} avisos`
                  : 'ao vivo'}
            </span>
          </section>
        )}

        {activeView === 'feed' && (
          <section className="screen-stack">
            <section className="story-rail" aria-label="Hoopers em destaque">
              {stories.length === 0 && (
                <button type="button" onClick={openComposer}>
                  <span><Icon name="plus" /></span>
                  <small>Novo post</small>
                </button>
              )}
              {stories.slice(0, 5).map((story) => (
                <button key={story.id} type="button" onClick={() => openStory(story.id)}>
                  <span>{initials(story.author)}</span>
                  <small>{story.author.split(' ')[0]}</small>
                </button>
              ))}
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
              onSavePost={handleSavePost}
              onSharePost={handleSharePost}
              savedPostIds={savedPostIds}
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
                    <button
                      type="button"
                      aria-label="Compartilhar story"
                      onClick={() => {
                        setStoryPaused(true);
                        handleShareStory(selectedStory);
                      }}
                    >
                      <Icon name="more" />
                    </button>
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
          <section className="games-screen">
            <header className="games-header">
              <BrandLogo compact />
              <h1>Encontrar <span>Jogos</span></h1>
              <div>
                <button type="button" aria-label="Filtros" onClick={() => setGamesTab('mine')}><Icon name="filter" /></button>
                <button type="button" aria-label="Calendario" onClick={() => setGamesTab('upcoming')}><Icon name="calendar" /></button>
              </div>
            </header>

            <label className="games-search">
              <Icon name="search" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar jogos, quadras ou bairros..."
              />
            </label>

            <section className="games-tabs" aria-label="Tipo de lista">
              <button type="button" className={gamesTab === 'upcoming' ? 'active' : ''} onClick={() => setGamesTab('upcoming')}>
                <Icon name="calendar" /> Proximos
              </button>
              <button type="button" className={gamesTab === 'mine' ? 'active' : ''} onClick={() => setGamesTab('mine')}>
                <Icon name="person" /> Meus jogos
              </button>
              <button type="button" className={gamesTab === 'saved' ? 'active' : ''} onClick={() => setGamesTab('saved')}>
                <Icon name="star" /> Favoritos
              </button>
            </section>

            <section className="games-filters" aria-label="Filtros de jogos">
              {[
                ['calendar', 'Data', gameDateLabel, cycleGameDateFilter, gameDateFilter !== 'all'],
                ['time', 'Horario', gameTimeLabel, cycleGameTimeFilter, gameTimeFilter !== 'any'],
                ['location', 'Local', gameLocationLabel, cycleGameLocationFilter, gameLocationFilter !== 'all'],
                ['court', 'Quadras', gameCourtLabel, cycleGameCourtFilter, Boolean(gameCourtFilter)],
              ].map(([icon, label, value, onClick, active]) => (
                <button
                  key={label as string}
                  type="button"
                  className={active ? 'active' : ''}
                  onClick={onClick as () => void}
                  title={`Alterar filtro: ${label}`}
                >
                  <Icon name={icon as 'calendar' | 'time' | 'location' | 'court'} />
                  <span>{label as string}</span>
                  <b>{value as string}</b>
                  <Icon name="chevron" />
                </button>
              ))}
            </section>

            {hasGameFilters && (
              <button
                type="button"
                className="games-clear-filters"
                onClick={() => {
                  setGameDateFilter('all');
                  setGameTimeFilter('any');
                  setGameLocationFilter('all');
                  setGameCourtFilter('');
                  setSearch('');
                }}
              >
                Limpar filtros
              </button>
            )}

            <div className="games-section-head">
              <h2>Jogos proximos</h2>
              <span>{visibleRuns.length} jogos encontrados</span>
            </div>

            <section className="games-list" aria-label="Jogos proximos">
              {visibleRuns.length === 0 && (
                <article className="empty-state">
                  Nenhum jogo publicado ainda. Crie um rachao para ele aparecer aqui.
                </article>
              )}
              {visibleRuns.map((game) => {
                const court = courts.find((item) => item.id === game.courtId);
                const playerName = profile.name.trim() || 'Voce';
                const isGoing = game.going.includes(playerName);
                const isSaved = savedRunIds.includes(game.id);

                return (
                <article key={game.id} className="game-card orange">
                  <div className="game-image">
                    <img src="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=700&q=85" alt={game.title} />
                    <span>{game.going.length}</span>
                  </div>
                  <div className="game-main">
                    <small>{game.time}</small>
                    <h3>{game.title}</h3>
                    <p><Icon name="location" /> {court?.name || 'Quadra'}<br />{court?.address || profile.city}</p>
                    <footer>
                      <span><Icon name="person" /> {game.players}</span>
                      <span><Icon name="grid" /> {game.notes}</span>
                    </footer>
                  </div>
                  <aside className="game-side">
                    <button
                      type="button"
                      className={isSaved ? 'following' : ''}
                      onClick={() => handleSaveRun(game.id)}
                      aria-label={isSaved ? 'Remover jogo salvo' : 'Salvar jogo'}
                    >
                      <Icon name="bookmark" />
                    </button>
                    <span>Organizador</span>
                    <strong><span className="ranking-avatar">{initials(game.host)}</span>{game.host}</strong>
                    <small>Confirmados</small>
                    <b>{game.going.length}</b>
                    <button type="button" className={isGoing ? 'following' : ''} onClick={() => toggleRunPresence(game.id)}>
                      {isGoing ? 'Sair' : 'Entrar'}
                    </button>
                  </aside>
                </article>
                );
              })}
            </section>

            <article className="create-game-card">
              <Icon name="calendar" />
              <div>
                <strong>Organize seu jogo</strong>
                <p>Crie seu jogo e chame a galera para entrar na quadra com voce.</p>
              </div>
              <button type="button" onClick={() => setIsRunFormOpen(true)}>Criar jogo <Icon name="chevron" /></button>
            </article>

            <article className="create-game-card">
              <Icon name="court" />
              <div>
                <strong>Novo rachao</strong>
                <p>Publique horario, quadra e vagas com dados seus, sem preencher a comunidade com perfis inventados.</p>
              </div>
              <button type="button" onClick={() => setIsRunFormOpen((current) => !current)}>
                {isRunFormOpen ? 'Fechar' : 'Abrir formulario'} <Icon name="chevron" />
              </button>
            </article>

            {isRunFormOpen && (
              <form className="run-form" onSubmit={handleCreatePickupRun}>
                <label className="field">
                  <span>Quadra</span>
                  <select value={runDraft.courtId} onChange={(event) => setRunDraft((current) => ({ ...current, courtId: event.target.value }))}>
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>{court.name}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Titulo</span>
                  <input
                    value={runDraft.title}
                    onChange={(event) => setRunDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="3x3 no Centro"
                  />
                </label>
                <label className="field">
                  <span>Horario</span>
                  <input
                    value={runDraft.time}
                    onChange={(event) => setRunDraft((current) => ({ ...current, time: event.target.value }))}
                    placeholder="Hoje, 20:00"
                  />
                </label>
                <label className="field">
                  <span>Vagas</span>
                  <input
                    value={runDraft.players}
                    onChange={(event) => setRunDraft((current) => ({ ...current, players: event.target.value }))}
                    placeholder="Aberto, faltam 2..."
                  />
                </label>
                <label className="field">
                  <span>Notas</span>
                  <textarea
                    value={runDraft.notes}
                    onChange={(event) => setRunDraft((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Nivel, bola, regras da quadra..."
                  />
                </label>
                {runFormError && <p className="Profile-edit-error">{runFormError}</p>}
                <button type="submit">Publicar jogo</button>
              </form>
            )}
          </section>
        )}

        {activeView === 'runs' && (
          <section className="ranking-screen">
            <header className="ranking-header">
              <BrandLogo compact />
              <h1>Ranking</h1>
              <div>
                <button type="button" aria-label="Informacoes" onClick={() => setActiveView('profile')}><Icon name="shield" /></button>
                <button type="button" aria-label="Compartilhar ranking" onClick={handleShareRanking}><Icon name="send" /></button>
              </div>
            </header>

            <section className="ranking-tabs" aria-label="Filtros do ranking">
              {[
                ['geral', 'Geral'],
                ['regional', 'Regional'],
                ['seguindo', 'Seguindo'],
                ['amigos', 'Amigos'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={rankingTab === id ? 'active' : ''}
                  onClick={() => setRankingTab(id as 'geral' | 'regional' | 'seguindo' | 'amigos')}
                >
                  {label}
                </button>
              ))}
            </section>

            <section className="ranking-podium" aria-label="Top 3 do ranking">
              <article className="podium-player first">
                <span className="podium-crown">#</span>
                <span className="podium-badge">1</span>
                <span className="podium-avatar">{initials(profile.name || 'Hooper')}</span>
                <strong>@{profileHandle}</strong>
                <em>{currentRank}</em>
                <b>{activityPoints.toLocaleString('pt-BR')} pts</b>
              </article>
            </section>

            <form className="ranking-score-card" onSubmit={handleSubmitRankingPoints}>
              <div>
                <span><Icon name="plus" /></span>
                <div>
                  <strong>Adicionar pontuacao</strong>
                  <p>Registre pontos de partidas, treinos ou desafios para atualizar seu rank.</p>
                </div>
              </div>
              <div className="ranking-score-fields">
                <label className="field">
                  <span>Motivo</span>
                  <select value={scoreReason} onChange={(event) => setScoreReason(event.target.value)}>
                    <option>Partida jogada</option>
                    <option>Vitoria</option>
                    <option>Treino concluido</option>
                    <option>Desafio da comunidade</option>
                    <option>Bonus manual</option>
                  </select>
                </label>
                <label className="field">
                  <span>Pontos</span>
                  <input
                    inputMode="numeric"
                    value={scoreDraft}
                    onChange={(event) => setScoreDraft(event.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Ex: 50"
                  />
                </label>
              </div>
              <div className="ranking-score-actions">
                {[10, 50, 100].map((points) => (
                  <button key={points} type="button" onClick={() => handleAddRankingPoints(points, `atalho +${points}`)}>
                    +{points}
                  </button>
                ))}
                <button type="submit">Adicionar</button>
              </div>
              <small>
                Automatico: {automaticPoints.toLocaleString('pt-BR')} pts | Manual: {manualRankingPoints.toLocaleString('pt-BR')} pts
              </small>
            </form>

            <section className="ranking-list" aria-label="Lista do ranking">
              <article className="ranking-row">
                <span className="ranking-place">1</span>
                <span className="ranking-avatar">{initials(profile.name || 'Hooper')}</span>
                <span>
                  <strong>@{profileHandle}</strong>
                  <small>{currentRank}</small>
                </span>
                <b>{activityPoints.toLocaleString('pt-BR')} pts</b>
                <Icon name="chevron" />
              </article>
              <article className="empty-state">
                O ranking publico ainda nao tem outros atletas reais conectados nesta instalacao.
              </article>
            </section>

            <article className="ranking-rewards">
              <span><Icon name="trophy" /></span>
              <div>
                <strong>Suba no ranking e desbloqueie recompensas exclusivas!</strong>
                <p>Quanto mais pontos, mais destaque na comunidade.</p>
              </div>
              <button type="button" onClick={() => setActiveView('profile')}>Ver meu perfil</button>
            </article>

            <section className="ranking-system" aria-label="Sistema de ranks">
              <h2>Sistema de ranks</h2>
              <div className="rank-medals">
                {['Rookie', 'Sixth Man', 'Starter', 'All-Star', 'MVP', 'Hall of Fame'].map((rank) => (
                  <span key={rank} className={rank === currentRank ? 'current' : ''}>
                    <i />
                    <b>{rank}</b>
                  </span>
                ))}
              </div>
              <div className="rank-progress"><i style={{ width: `${rankProgress}%` }} /></div>
              <footer>
                <span>Seu rank atual <b>{currentRank}</b></span>
                <span>Proximo rank <b>{nextRank}</b></span>
                <span>Faltam {Math.max(nextRankPoints - activityPoints, 0).toLocaleString('pt-BR')} pts</span>
              </footer>
            </section>
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
              {filteredDirectThreads.length === 0 && (
                <article className="empty-state">
                  Nenhuma conversa ainda. Responda a um story ou compartilhe um post para iniciar um direct.
                </article>
              )}
              {filteredDirectThreads.map((thread) => {
                const lastMessage = thread.messages[thread.messages.length - 1];

                return (
                  <button
                    key={thread.id}
                    type="button"
                    className={`direct-thread${thread.id === selectedDirectThread?.id ? ' active' : ''}`}
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

              {followers.length === 0 && (
                <article className="empty-state">
                  Nenhum seguidor real ainda. Quando alguem interagir com voce, aparece aqui.
                </article>
              )}
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
                {notifications.length === 0 && (
                  <article className="empty-state">
                    Sem atividade por enquanto. Curtidas, salvos, posts e jogos vao aparecer aqui.
                  </article>
                )}
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
          <section className="screen-stack instagram-Profile">
            <header className="Profile-topbar">
              <button type="button" onClick={() => setActiveView('feed')} aria-label="Voltar ao feed">
                <Icon name="chevron" />
              </button>
              <strong className="Profile-wordmark">Hoopers <span>Radar</span></strong>
              <div>
                <button className="notification-button" type="button" aria-label="Notificacoes" onClick={() => setActiveView('notifications')}>
                  <Icon name="bell" />
                  {unreadNotifications > 0 && <span>{unreadNotifications}</span>}
                </button>
                <button type="button" aria-label="Mais opcoes" onClick={openProfileEditor}>
                  <Icon name="more" />
                </button>
              </div>
            </header>

            <section className="Profile-hero" aria-label="Resumo do perfil">
              <div className="Profile-avatar-ring">
                <span className="Profile-avatar instagram-avatar">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={`${profile.name || 'Perfil'} avatar`} />
                  ) : (
                    initials(profile.name || 'Hooper')
                  )}
                </span>
                <button type="button" onClick={openProfileEditor} aria-label="Editar foto">
                  <Icon name="edit" />
                </button>
              </div>

              <div className="Profile-identity">
                <h1>@{profileHandle}</h1>
                <strong>{profile.name || 'Meu perfil'}</strong>
                <p><Icon name="location" /> {profile.city || 'Minha cidade'}</p>
                <span><Icon name="shield" /> {profile.position} | {profile.level}</span>
              </div>
            </section>

            <section className="Profile-counts" aria-label="Estatisticas do perfil">
              <span><b>{profilePosts.length}</b>Posts</span>
              <span><b>{followerCount.toLocaleString('pt-BR')}</b>Seguidores</span>
              <span><b>{following.length}</b>Seguindo</span>
              <span><b>{profileRunCount}</b>Jogos</span>
            </section>

            <section className="Profile-rank-card" aria-label="Nivel atual">
              <span className="Profile-rank-emblem" aria-hidden="true" />
              <div>
                <small>Nivel atual</small>
                <strong>{currentRank}</strong>
                <span className="Profile-xp-bar"><i style={{ width: `${rankProgress}%` }} /></span>
                <p>{activityPoints.toLocaleString('pt-BR')} / {nextRankPoints.toLocaleString('pt-BR')} XP</p>
              </div>
              <button type="button" onClick={() => setActiveView('runs')}>
                Ver ranks
                <Icon name="chevron" />
              </button>
            </section>

            <section className="Profile-actions">
              <button type="button" onClick={openProfileEditor}><Icon name="edit" /> Editar perfil</button>
              <button type="button" onClick={handleShareProfile}><Icon name="share" /> Compartilhar perfil</button>
            </section>

            {isEditingProfile && (
              <form className="Profile-edit-card" onSubmit={handleSaveProfile}>
                <div className="Profile-edit-head">
                  <div>
                    <p className="eyebrow">Editar perfil</p>
                    <h2>Dados do atleta</h2>
                  </div>
                  <button type="button" onClick={() => setIsEditingProfile(false)}>Cancelar</button>
                </div>

                <div className="Profile-image-preview">
                  <div className={`Profile-cover-preview${profileDraft.bannerUrl ? ' has-cover' : ''}`}>
                    {profileDraft.bannerUrl && (
                      <img className="Profile-cover-image" src={profileDraft.bannerUrl} alt="Banner do perfil" />
                    )}
                    <span className="Profile-avatar preview-avatar">
                      {profileDraft.avatarUrl ? (
                        <img src={profileDraft.avatarUrl} alt="Avatar preview" />
                      ) : (
                        initials(profileDraft.name || 'Hooper')
                      )}
                    </span>
                  </div>
                  <p className="small-meta">Use fotos do seu dispositivo para deixar o perfil com cara de atleta.</p>
                </div>

                <div className="Profile-edit-grid two">
                  <label className="field">
                    <span>Capa do perfil</span>
                    <div className="image-input-row">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => event.target.files?.[0] && handleImageUpload('bannerUrl', event.target.files[0])}
                      />
                    </div>
                  </label>
                  <label className="field">
                    <span>Foto do perfil</span>
                    <div className="image-input-row">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => event.target.files?.[0] && handleImageUpload('avatarUrl', event.target.files[0])}
                      />
                    </div>
                  </label>
                </div>

                <label className="field">
                  <span>Nome</span>
                  <input
                    value={profileDraft.name}
                    onChange={(event) => updateProfileDraft('name', event.target.value)}
                    placeholder="Seu nome nas quadras"
                  />
                </label>

                <label className="field">
                  <span>@ usuario</span>
                  <input
                    value={profileDraft.username}
                    onChange={(event) => updateProfileDraft('username', event.target.value)}
                    placeholder="ex: luis.hoops"
                  />
                </label>

                <label className="field">
                  <span>Cidade base</span>
                  <input
                    value={profileDraft.city}
                    onChange={(event) => updateProfileDraft('city', event.target.value)}
                    placeholder="Cidade-UF"
                  />
                </label>

                <div className="Profile-edit-grid">
                  <label className="field">
                    <span>Idade</span>
                    <input
                      inputMode="numeric"
                      value={profileDraft.age}
                      onChange={(event) => updateProfileDraft('age', event.target.value)}
                      placeholder="Ex: 22"
                    />
                  </label>

                  <label className="field">
                    <span>Altura</span>
                    <input
                      value={profileDraft.height}
                      onChange={(event) => updateProfileDraft('height', event.target.value)}
                      placeholder="Ex: 1,82 m"
                    />
                  </label>

                  <label className="field">
                    <span>Peso</span>
                    <input
                      value={profileDraft.weight}
                      onChange={(event) => updateProfileDraft('weight', event.target.value)}
                      placeholder="Opcional"
                    />
                  </label>
                </div>

                <div className="Profile-edit-grid two">
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
                  <span>Quando joga</span>
                  <input
                    value={profileDraft.availability}
                    onChange={(event) => updateProfileDraft('availability', event.target.value)}
                    placeholder="Noites, sabados, domingos..."
                  />
                </label>

                <label className="field">
                  <span>Estilo de jogo</span>
                  <textarea
                    value={profileDraft.characteristics}
                    onChange={(event) => updateProfileDraft('characteristics', event.target.value)}
                    placeholder="Arremesso, defesa, velocidade, passe..."
                  />
                </label>

                <label className="field">
                  <span>Bio de jogador</span>
                  <textarea
                    value={profileDraft.history}
                    onChange={(event) => updateProfileDraft('history', event.target.value)}
                    placeholder="Conte como joga, onde costuma jogar e o que procura"
                  />
                </label>

                {profileError && <p className="Profile-edit-error">{profileError}</p>}

                <button className="Profile-save-button" type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Salvando...' : 'Salvar perfil'}
                </button>
              </form>
            )}

            <div className="Profile-section-head">
              <h2>Destaques</h2>
              <button type="button" onClick={openComposer}>Novo</button>
            </div>

            <section className="Profile-highlights" aria-label="Destaques do perfil">
              <button type="button" onClick={() => { setGamesTab('mine'); setActiveView('explore'); }}>
                <span><Icon name="court" /></span>
                <small>Meus jogos</small>
              </button>
              <button type="button" onClick={() => setActiveView('runs')}>
                <span><Icon name="trophy" /></span>
                <small>Ranking</small>
              </button>
              <button type="button" onClick={() => setProfileTab('posts')}>
                <span><Icon name="grid" /></span>
                <small>Posts</small>
              </button>
              <button type="button" onClick={() => setProfileTab('saved')}>
                <span><Icon name="bookmark" /></span>
                <small>Salvos</small>
              </button>
              <button type="button" onClick={openProfileEditor}>
                <span><Icon name="edit" /></span>
                <small>Editar</small>
              </button>
              <button type="button" onClick={openComposer}>
                <span><Icon name="plus" /></span>
                <small>Novo</small>
              </button>
            </section>

            <section className="Profile-tabs" aria-label="Conteudo do perfil">
              <button
                type="button"
                className={profileTab === 'posts' ? 'active' : ''}
                onClick={() => setProfileTab('posts')}
                aria-label="Publicacoes"
              >
                <Icon name="grid" />
              </button>
              <button
                type="button"
                className={profileTab === 'reels' ? 'active' : ''}
                onClick={() => setProfileTab('reels')}
                aria-label="Reels"
              >
                <Icon name="camera" />
              </button>
              <button
                type="button"
                className={profileTab === 'saved' ? 'active' : ''}
                onClick={() => setProfileTab('saved')}
                aria-label="Salvos"
              >
                <Icon name="bookmark" />
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

            {profileTab === 'posts' || profileTab === 'saved' ? (
              <section className="Profile-post-grid">
                {visibleProfileGridPosts.length === 0 && (
                  <article className="Profile-empty-grid">
                    <Icon name="bookmark" />
                    <strong>Nenhum post salvo ainda</strong>
                    <p>Salve publicacoes do feed para montar sua colecao.</p>
                  </article>
                )}
                {visibleProfileGridPosts.map((post, index) => (
                  <button
                    key={post.id}
                    type="button"
                    className="Profile-post-tile"
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
              <article className="Profile-empty-grid">
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
        <button className="nav-create" type="button" onClick={openComposer} aria-label="Criar post">
          <Icon name="plus" />
          <span>Criar</span>
        </button>
        <button className={activeView === 'runs' ? 'active' : ''} type="button" onClick={() => setActiveView('runs')}>
          <Icon name="trophy" />
          <span>Ranking</span>
        </button>
        <button className={activeView === 'profile' ? 'active' : ''} type="button" onClick={() => setActiveView('profile')}>
          <Icon name="person" />
          <span>Perfil</span>
        </button>
      </nav>

      {activeView !== 'profile' && activeView !== 'feed' && (
        <button type="button" className="floating-compose" onClick={openComposer} aria-label="Criar post">
          <Icon name="chat" />
        </button>
      )}

      {isComposerOpen && (
        <section className="insta-modal" role="dialog" aria-modal="true" aria-label="Criar publicacao">
          <button className="insta-modal-backdrop" type="button" onClick={() => setIsComposerOpen(false)} aria-label="Fechar"></button>
          <form className="insta-composer" onSubmit={handleSubmitComposer}>
            <header>
              <button type="button" onClick={() => setIsComposerOpen(false)} aria-label="Cancelar">x</button>
              <strong>Nova publicacao</strong>
              <button type="submit" disabled={!composerText.trim()}>Compartilhar</button>
            </header>
            <label>
              <span>Legenda</span>
              <textarea
                value={composerText}
                onChange={(event) => setComposerText(event.target.value)}
                placeholder="Escreva uma legenda, use #tags e chame a galera..."
                rows={5}
                maxLength={220}
              />
            </label>
            <label>
              <span>URL da imagem</span>
              <input
                value={composerImageUrl}
                onChange={(event) => setComposerImageUrl(event.target.value)}
                placeholder="https://..."
              />
            </label>
            <p>{220 - composerText.length} caracteres restantes</p>
          </form>
        </section>
      )}

      {selectedCommentPost && (
        <section className="insta-modal" role="dialog" aria-modal="true" aria-label="Comentarios">
          <button className="insta-modal-backdrop" type="button" onClick={() => setSelectedCommentPostId(null)} aria-label="Fechar"></button>
          <article className="comments-sheet">
            <header>
              <button type="button" onClick={() => setSelectedCommentPostId(null)} aria-label="Fechar">x</button>
              <strong>Comentarios</strong>
              <span>{selectedCommentPost.replies}</span>
            </header>
            <div className="comment-original">
              <span className="social-avatar">{initials(selectedCommentPost.author)}</span>
              <p><b>{selectedCommentPost.handle}</b> {selectedCommentPost.text}</p>
            </div>
            <div className="comment-list">
              {selectedComments.length === 0 ? (
                <p className="comment-empty">Seja o primeiro a comentar.</p>
              ) : (
                selectedComments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <span className="social-avatar">{initials(comment.author)}</span>
                    <p><b>{comment.handle}</b> {comment.text}<small>{comment.time}</small></p>
                  </div>
                ))
              )}
            </div>
            <form className="comment-composer" onSubmit={handleSubmitComment}>
              <input
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Adicione um comentario..."
              />
              <button type="submit" disabled={!commentDraft.trim()}>
                <Icon name="send" />
              </button>
            </form>
          </article>
        </section>
      )}
    </div>
  );
}

export default App;
