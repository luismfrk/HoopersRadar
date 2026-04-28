type IconName =
  | 'calendar'
  | 'chat'
  | 'chevron'
  | 'court'
  | 'filter'
  | 'heart'
  | 'location'
  | 'map'
  | 'person'
  | 'radar'
  | 'repeat'
  | 'search'
  | 'send'
  | 'shield'
  | 'star'
  | 'time'
  | 'trophy';

type Props = {
  name: IconName;
  className?: string;
};

const paths: Record<IconName, string[]> = {
  calendar: [
    'M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  ],
  chat: ['M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z'],
  chevron: ['m9 18 6-6-6-6'],
  court: ['M4 5h16v14H4V5Z', 'M12 5v14', 'M4 12h16', 'M8 8a4 4 0 0 1 0 8', 'M16 8a4 4 0 0 0 0 8'],
  filter: ['M4 6h16M7 12h10M10 18h4'],
  heart: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z'],
  location: ['M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z'],
  map: ['M9 18 3 1 3-1 5 2V6l-5-2-3 1-3-1-5 2v14l5-2Z', 'M9 4v14', 'M15 4v14'],
  person: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'],
  radar: ['M12 12 19 5', 'M20 12a8 8 0 1 1-8-8', 'M16 12a4 4 0 1 1-4-4', 'M12 12h.01'],
  repeat: ['M17 2l4 4-4 4', 'M3 11V9a3 3 0 0 1 3-3h15', 'M7 22l-4-4 4-4', 'M21 13v2a3 3 0 0 1-3 3H3'],
  search: ['M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z', 'm21 21-4.35-4.35'],
  send: ['M22 2 11 13', 'M22 2 15 22l-4-9-9-4 20-7Z'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'],
  star: ['m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 20.6l1-6.1-4.4-4.3 6.1-.9L12 3Z'],
  time: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
  trophy: ['M8 4h8v4a4 4 0 0 1-8 0V4Z', 'M8 6H5a3 3 0 0 0 3 3', 'M16 6h3a3 3 0 0 1-3 3', 'M12 12v5', 'M9 21h6', 'M10 17h4'],
};

function Icon({ name, className }: Props) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {paths[name].map((path) => (
        <path key={path} d={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      ))}
    </svg>
  );
}

export default Icon;
