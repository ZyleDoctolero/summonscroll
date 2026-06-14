export interface AtmosphereBackdropProps {
  realm: string;
  intensity?: 'subtle' | 'full';
}

export function AtmosphereBackdrop({ realm, intensity = 'subtle' }: AtmosphereBackdropProps) {
  return (
    <>
      {/* Top gradient band - 4px realm color stripe */}
      <div
        className="fixed top-0 inset-x-0 h-1 z-40"
        style={{ background: `var(--realm-${realm}, var(--accent-gold))` }}
      />
      {/* Background wash */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse at top, var(--realm-${realm}, transparent) 0%, transparent 60%)`,
          opacity: intensity === 'subtle' ? 0.08 : 0.15,
        }}
      />
    </>
  );
}
