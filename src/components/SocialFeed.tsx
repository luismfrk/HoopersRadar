import { useMemo, useState } from 'react';
import Icon from './Icon';
import type { PlayerProfile, SocialPost } from '../types';

type Props = {
  profile: PlayerProfile;
  posts: SocialPost[];
  onCreatePost: (text: string) => void;
  onTogglePost: (id: string, action: 'like' | 'repost') => void;
  onSelectTag: (tag: string) => void;
  selectedTag: string;
  onClearTag: () => void;
  onCommentPost: (id: string) => void;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

function SocialFeed({ profile, posts, onCreatePost, onTogglePost, onSelectTag, selectedTag, onClearTag, onCommentPost }: Props) {
  const [draft, setDraft] = useState('');

  const authorName = profile.name.trim() || 'Voce';
  const canPost = draft.trim().length > 0;

  const trendingTags = useMemo(() => ['#MalletPR', '#BrasilHoopers', '#TreinoLivre'], []);

  const publish = () => {
    if (!canPost) return;
    onCreatePost(draft.trim());
    setDraft('');
  };

  return (
    <section className="social-feed">
      <article className="composer-card">
        <div className="social-avatar">{getInitials(authorName)}</div>
        <div className="composer-body">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="O que aconteceu no seu treino hoje?"
            maxLength={180}
          />
          <div className="composer-footer">
            <span>{180 - draft.length} caracteres</span>
            <button type="button" disabled={!canPost} onClick={publish}>
              <Icon name="send" />
              Postar
            </button>
          </div>
        </div>
      </article>

      <div className="trend-row" aria-label="Assuntos em alta">
        {trendingTags.map((tag) => (
          <button key={tag} type="button" onClick={() => onSelectTag(tag)}>{tag}</button>
        ))}
      </div>

      {selectedTag && (
        <div className="active-filter">
          <span>Filtrando por #{selectedTag}</span>
          <button type="button" onClick={onClearTag}>Limpar</button>
        </div>
      )}

      <div className="timeline-list">
        {posts.length === 0 && (
          <article className="empty-state">
            Nenhum post encontrado nesse filtro. Limpe a hashtag ou publique algo novo.
          </article>
        )}

        {posts.map((post) => (
          <article key={post.id} className="social-post">
            <div className="social-avatar">{getInitials(post.author)}</div>
            <div className="post-content">
              <header className="post-header">
                <div>
                  <strong>{post.author}</strong>
                  <span>{post.handle} / {post.time}</span>
                </div>
                <small>{post.role}</small>
              </header>

              {post.imageUrl && (
                <div className="post-image">
                  <img src={post.imageUrl} alt={`Imagem do post de ${post.author}`} />
                </div>
              )}

              <p>{post.text}</p>

              <div className="post-meta">
                <span>{post.city}</span>
                <span>#{post.tag}</span>
              </div>

              <div className="post-actions">
                <button type="button" onClick={() => onCommentPost(post.id)} aria-label="Responder">
                  <Icon name="chat" />
                  {post.replies}
                </button>
                <button
                  type="button"
                  className={post.reposted ? 'active' : ''}
                  onClick={() => onTogglePost(post.id, 'repost')}
                  aria-label="Repostar"
                >
                  <Icon name="repeat" />
                  {post.reposts}
                </button>
                <button
                  type="button"
                  className={post.liked ? 'active like' : ''}
                  onClick={() => onTogglePost(post.id, 'like')}
                  aria-label="Curtir"
                >
                  <Icon name="heart" />
                  {post.likes}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SocialFeed;
