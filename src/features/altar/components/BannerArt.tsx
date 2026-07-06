import { LazyImage } from '@/components/ui/LazyImage'

interface BannerArtProps {
  artUrl?: string
  bannerName: string
  bannerType: string
  timeLeft: string
}

const BANNER_TYPE_LABELS = {
  standard:   'Standard',
  featured:   'Featured',
  streak:     'Streak',
  pact_seal:  'Pact Seal',
  event:      'Event',
}

export function BannerArt({ artUrl, bannerName, bannerType, timeLeft }: BannerArtProps) {
  return (
    <div className="relative w-full h-48 bg-bg-elevated overflow-hidden">
      {artUrl ? (
        <LazyImage
          src={artUrl}
          alt={`${bannerName} banner art`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          fallback="/images/summonscroll/summoning_altar.jpg"
        />
      ) : (
        <LazyImage
          src="/images/summonscroll/summoning_altar.jpg"
          alt="Summoning Altar"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      )}

      {/* Timer arc overlay */}
      <div
        className="absolute top-2 right-2 bg-bg-overlay rounded-pill px-2 py-1 text-12 font-mono font-bold text-text-primary"
        aria-label={`Time remaining: ${timeLeft}`}
      >
        ⏱ {timeLeft}
      </div>

      {/* Banner type badge */}
      <div className="absolute top-2 left-2">
        <span className="bg-bg-overlay rounded-pill px-2 py-1 text-11 font-medium text-gold uppercase tracking-wider">
          {BANNER_TYPE_LABELS[bannerType as keyof typeof BANNER_TYPE_LABELS]}
        </span>
      </div>
    </div>
  )
}
