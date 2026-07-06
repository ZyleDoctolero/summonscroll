interface SkinSelectorProps {
  userMonsterId: string
  equippedSkinId: string | null
  monsterId: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SkinSelector(_props: SkinSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider">
        Skins
      </h3>
      <p className="text-13 text-text-tertiary">
        Skins are cosmetic overlays unlocked through events and achievements.
        They do not affect stats.
      </p>
      <div className="text-center py-4 text-text-disabled text-13">
        No skins owned yet. Participate in events to unlock skins.
      </div>
    </div>
  )
}
