type BrandLogoProps = {
  compact?: boolean;
  status?: string;
};

function BrandLogo({ compact = false, status }: BrandLogoProps) {
  return (
    <span className={`radar-brand${compact ? ' compact' : ''}`}>
      <span className="radar-emblem" aria-hidden="true">
        <span className="radar-ball" />
        <span className="radar-sweep" />
      </span>
      <span className="radar-wordmark">
        <strong>Hoopers</strong>
        <b>Radar</b>
        {status && <small>{status}</small>}
      </span>
    </span>
  );
}

export default BrandLogo;
