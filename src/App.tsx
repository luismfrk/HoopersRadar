import { FormEvent, useMemo, useState } from 'react';
import { api } from './api';
import Icon from './components/Icon';
import LoginScreen from './components/LoginScreen';
import SocialFeed from './components/SocialFeed';
import { mockCourts, mockPartners, mockPosts } from './data/mockData';
import { Court, Partner, PlayerProfile, SocialPost } from './types';

type View = 'feed' | 'explore' | 'runs' | 'profile';

const positions = ['Armador', 'Ala', 'Pivo'];
const levels = ['Iniciante', 'Intermediario', 'Avancado'];

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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<View>('feed');
  const [profile, setProfile] = useState<PlayerProfile>(initialProfile);
  const [hoopers, setHoopers] = useState<Partner[]>(mockPartners);
  const [courts, setCourts] = useState<Court[]>(mockCourts);
  const [posts, setPosts] = useState<SocialPost[]>(mockPosts);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('offline');
  const [search, setSearch] = useState('');
  const [feedTab, setFeedTab] = useState<'forYou' | 'following' | 'nearby'>('forYou');
  const [following, setFollowing] = useState<string[]>([]);
  const [joinedRuns, setJoinedRuns] = useState<string[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<PlayerProfile>(initialProfile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const screen = viewCopy[activeView];

  const filteredHoopers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return hoopers;

    return hoopers.filter((hooper) =>
      `${hooper.name} ${hooper.position} ${hooper.city} ${hooper.neighborhood}`.toLowerCase().includes(term),
    );
  }, [hoopers, search]);

  const profileCompleteness = useMemo(() => {
    const values = Object.values(profile);
    const filled = values.filter((value) => value.trim().length > 0).length;
    return Math.round((filled / values.length) * 100);
  }, [profile]);

  const profileBannerStyle = profile.bannerUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(22, 32, 24, 0.88), rgba(223, 93, 56, 0.78)), url("${profile.bannerUrl}")`,
      }
    : undefined;

  const visiblePosts = useMemo(() => {
    if (feedTab === 'nearby') {
      return posts.filter((post) => post.city === profile.city);
    }

    if (feedTab === 'following' && following.length) {
      return posts.filter((post) => following.includes(post.author));
    }

    return posts;
  }, [feedTab, following, posts, profile.city]);

  const suggestedHoopers = useMemo(() => {
    return hoopers.filter((hooper) => !following.includes(hooper.name)).slice(0, 3);
  }, [following, hoopers]);

  const loadBackendData = async () => {
    const data = await api.bootstrap();
    setProfile(data.profile);
    setHoopers(data.partners);
    setCourts(data.courts);
    setPosts(data.posts);
  };

  const hydrateApp = async (incomingProfile: PlayerProfile) => {
    const data = await api.bootstrap();
    const mergedProfile = { ...data.profile, ...incomingProfile };
    setProfile(mergedProfile);
    setHoopers(data.partners);
    setCourts(data.courts);
    setPosts(data.posts);
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
    const fallbackPost: SocialPost = {
      id: `local-${Date.now()}`,
      author: profile.name.trim() || 'Voce',
      handle: '@meu.hoops',
      role: profile.position || 'Hooper',
      city: profile.city || 'Mallet-PR',
      time: 'agora',
      text,
      tag: 'post',
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
        tag: 'post',
      });
      setPosts((current) => [created, ...current]);
      setApiStatus('online');
    } catch {
      setPosts((current) => [fallbackPost, ...current]);
      setApiStatus('offline');
    }
  };

  const handleTogglePost = async (id: string, action: 'like' | 'repost') => {
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
      const result = event.target?.result as string;
      updateProfileDraft(field, result);
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

        <button type="button" className="icon-action" aria-label="Novo post" onClick={() => setActiveView('feed')}>
          <Icon name="send" />
        </button>
      </header>

      <main className="app-main">
        <section className="screen-title social-title">
          <div>
            <p className="eyebrow">{screen.eyebrow}</p>
            <h1>{screen.title}</h1>
          </div>
          <span className="status-pill">
            {activeView === 'profile'
              ? `${profileCompleteness}%`
              : activeView === 'explore'
                ? `${filteredHoopers.length} hoopers`
                : activeView === 'runs'
                  ? `${courts.length} runs`
                  : 'ao vivo'}
          </span>
        </section>

        {activeView === 'feed' && (
          <section className="screen-stack">
            <div className="feed-tabs" role="tablist" aria-label="Filtro da timeline">
              <button className={feedTab === 'forYou' ? 'active' : ''} type="button" onClick={() => setFeedTab('forYou')}>
                Pra voce
              </button>
              <button className={feedTab === 'following' ? 'active' : ''} type="button" onClick={() => setFeedTab('following')}>
                Seguindo
              </button>
              <button className={feedTab === 'nearby' ? 'active' : ''} type="button" onClick={() => setFeedTab('nearby')}>
                Perto
              </button>
            </div>

            <section className="story-rail" aria-label="Hoopers em destaque">
              {hoopers.slice(0, 5).map((hooper) => (
                <button key={hooper.id} type="button">
                  <span>{initials(hooper.name)}</span>
                  <small>{hooper.name.split(' ')[0]}</small>
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
                    <button type="button" onClick={() => setFollowing((current) => [...current, hooper.name])}>
                      Seguir
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <SocialFeed profile={profile} posts={visiblePosts} onCreatePost={handleCreatePost} onTogglePost={handleTogglePost} />
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
                    onClick={() =>
                      setFollowing((current) =>
                        current.includes(hooper.name) ? current.filter((name) => name !== hooper.name) : [...current, hooper.name],
                      )
                    }
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
            <article className="metric-card accent">
              <Icon name="time" />
              <span>Chamada aberta</span>
              <strong>Monte um rachao perto de voce.</strong>
              <p>Use os locais abaixo como ponto de encontro e chame a comunidade no feed.</p>
            </article>

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
                    onClick={() =>
                      setJoinedRuns((current) =>
                        current.includes(court.id) ? current.filter((id) => id !== court.id) : [...current, court.id],
                      )
                    }
                  >
                    {joinedRuns.includes(court.id) ? 'Participando' : 'Participar'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'profile' && (
          <section className="screen-stack">
            <article className="profile-hero-card">
              <div className="profile-cover" style={profileBannerStyle} />
              <div className="profile-row">
                <span className="profile-avatar">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={`${profile.name || 'Perfil'} avatar`} />
                  ) : (
                    initials(profile.name || 'Hooper')
                  )}
                </span>
                <div>
                  <strong>{profile.name || 'Seu nome'}</strong>
                  <p>@{profile.username || (profile.name || 'hooper').toLowerCase().replace(/\s+/g, '.')} / {profile.city}</p>
                </div>
              </div>
              <div className="profile-bio">
                <p>{profile.position} {profile.level} procurando rachoes, treinos e conexoes no basket.</p>
                <div>
                  <span>{profile.availability || 'Disponibilidade nao informada'}</span>
                  <span>{profile.characteristics || 'Adicione suas caracteristicas no cadastro em breve'}</span>
                </div>
              </div>
              <div className="profile-stats">
                <span><b>{posts.length}</b> posts</span>
                <span><b>{following.length}</b> seguindo</span>
                <span><b>{profileCompleteness}%</b> perfil</span>
              </div>
            </article>

            <section className="profile-actions">
              <button type="button" onClick={openProfileEditor}>Editar perfil</button>
              <button type="button">Compartilhar</button>
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
                  <div className="profile-cover-preview" style={profileDraft.bannerUrl ? { backgroundImage: `linear-gradient(135deg, rgba(22, 32, 24, 0.88), rgba(223, 93, 56, 0.78)), url("${profileDraft.bannerUrl}")` } : undefined}>
                    <span className="profile-avatar preview-avatar">
                      {profileDraft.avatarUrl ? (
                        <img src={profileDraft.avatarUrl} alt="Avatar preview" />
                      ) : (
                        initials(profileDraft.name || 'Hooper')
                      )}
                    </span>
                  </div>
                  <p className="small-meta">Cole URLs de imagem para banner e avatar para atualizar a aparência do perfil.</p>
                </div>

                <div className="profile-edit-grid two">
                  <label className="field">
                    <span>Banner do perfil</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => event.target.files?.[0] && handleImageUpload('bannerUrl', event.target.files[0])}
                        style={{ flex: 1 }}
                      />
                      <span style={{ color: '#657067', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>ou URL</span>
                    </div>
                    <input
                      value={(profileDraft.bannerUrl?.startsWith('data:')) ? '' : (profileDraft.bannerUrl || '')}
                      onChange={(event) => !event.target.value.startsWith('data:') && updateProfileDraft('bannerUrl', event.target.value)}
                      placeholder="https://..."
                      style={{ marginTop: '6px' }}
                    />
                  </label>
                  <label className="field">
                    <span>Foto do perfil</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => event.target.files?.[0] && handleImageUpload('avatarUrl', event.target.files[0])}
                        style={{ flex: 1 }}
                      />
                      <span style={{ color: '#657067', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>ou URL</span>
                    </div>
                    <input
                      value={(profileDraft.avatarUrl?.startsWith('data:')) ? '' : (profileDraft.avatarUrl || '')}
                      onChange={(event) => !event.target.value.startsWith('data:') && updateProfileDraft('avatarUrl', event.target.value)}
                      placeholder="https://..."
                      style={{ marginTop: '6px' }}
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
              <article>
                <Icon name="court" />
                <span>Rachoes</span>
              </article>
              <article>
                <Icon name="trophy" />
                <span>Highlights</span>
              </article>
              <article>
                <Icon name="heart" />
                <span>Favoritos</span>
              </article>
            </section>

            <section className="profile-tabs" aria-label="Conteudo do perfil">
              <button type="button" className="active">Posts</button>
              <button type="button">Marcados</button>
            </section>

            <section className="profile-post-grid">
              {posts.slice(0, 6).map((post) => (
                <article key={post.id}>
                  <span>#{post.tag}</span>
                  <p>{post.text}</p>
                </article>
              ))}
            </section>
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
        <button className={activeView === 'profile' ? 'active' : ''} type="button" onClick={() => setActiveView('profile')}>
          <Icon name="person" />
          <span>Perfil</span>
        </button>
      </nav>

      {activeView !== 'profile' && (
        <button type="button" className="floating-compose" onClick={() => setActiveView('feed')} aria-label="Criar post">
          <Icon name="send" />
        </button>
      )}
    </div>
  );
}

export default App;
