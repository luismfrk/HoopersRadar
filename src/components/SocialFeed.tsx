import Icon from './Icon';
import type { PlayerProfile, SocialPost } from '../types';

type Props = {
  profile: PlayerProfile;
  posts: SocialPost[];
  onCreatePost: (text: string, imageUrl?: string) => void;
  onTogglePost: (id: string, action: 'like' | 'repost') => void;
  onSelectTag: (tag: string) => void;
  selectedTag: string;
  onClearTag: () => void;
  onCommentPost: (id: string) => void;
  onSavePost: (id: string) => void;
  onSharePost: (id: string) => void;
  savedPostIds: string[];
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

function SocialFeed({
  profile,
  posts,
  onCreatePost,
  onTogglePost,
  onSelectTag,
  selectedTag,
  onClearTag,
  onCommentPost,
  onSavePost,
  onSharePost,
  savedPostIds,
}: Props) {
  void profile;
  void onCreatePost;
  void onSelectTag;
  void onClearTag;

  return (
    <section className="social-feed">
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
                  <span className="post-play-badge"><Icon name="plus" /></span>
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
                <button type="button" onClick={() => onSharePost(post.id)} aria-label="Enviar">
                  <Icon name="send" />
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
                <button
                  type="button"
                  className={savedPostIds.includes(post.id) ? 'active saved' : ''}
                  onClick={() => onSavePost(post.id)}
                  aria-label={savedPostIds.includes(post.id) ? 'Remover salvo' : 'Salvar'}
                >
                  <Icon name="bookmark" />
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
