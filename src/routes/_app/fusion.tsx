import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AnimatedPage } from '@/components/motion/AnimatedPage'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { monstersApi } from '@/features/monsters/api/monsters.api'
import { fusionApi } from '@/features/fusion/api/fusion.api'
import { MonsterCard } from '@/features/monsters/components/MonsterCard'
import { RarityBadge } from '@/components/ui/RarityBadge'
import { LazyImage } from '@/components/ui/LazyImage'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { useFusionUiStore } from '@/features/fusion/store/fusionUi.store'

export const Route = createFileRoute('/_app/fusion')({
  component: () => (
    <ErrorBoundary>
      <FusionPage />
    </ErrorBoundary>
  ),
})

const MAX_INGREDIENTS = 3

function MonsterThumb({ artUrl }: { artUrl?: string | null }) {
  if (artUrl) {
    return <LazyImage src={artUrl} alt="" className="w-full h-full object-cover" />
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-24 opacity-40">👾</div>
  )
}

function FusionPage() {
  const selectedIds = useFusionUiStore((s) => s.selectedIngredientIds)
  const setSelectedIngredientIds = useFusionUiStore((s) => s.setSelectedIngredientIds)
  const [showConfirm, setShowConfirm] = useState(false)
  const queryClient = useQueryClient()
  const { addToast } = useUiStore()

  const { data: monstersData } = useQuery({
    queryKey: ['user-monsters'],
    queryFn: () => monstersApi.getUserMonsters(),
  })

  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['fusion-preview', selectedIds],
    queryFn: () => fusionApi.preview(selectedIds),
    enabled: selectedIds.length >= 2,
  })

  const performMutation = useMutation({
    mutationFn: fusionApi.perform,
    onSuccess: (res) => {
      addToast({
        type: 'success',
        title: 'Fusion successful!',
        message: `Created ${res.data.resultMonster.name}`,
      })
      setSelectedIngredientIds([])
      setShowConfirm(false)
      void queryClient.invalidateQueries({ queryKey: ['user-monsters'] })
    },
    onError: (err) => {
      addToast({
        type: 'error',
        title: 'Fusion failed',
        message: err instanceof Error ? err.message : 'Please try again.',
      })
    },
  })

  const monsters = monstersData?.data ?? []
  const selected = useMemo(() => monsters.filter((um) => selectedIds.includes(um.id)), [monsters, selectedIds])
  const preview = previewData?.data

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIngredientIds(selectedIds.filter((i) => i !== id))
    } else if (selectedIds.length < MAX_INGREDIENTS) {
      setSelectedIngredientIds([...selectedIds, id])
    }
  }

  return (
    <AnimatedPage className="px-4 pt-24 pb-32 max-w-4xl mx-auto space-y-6 min-h-screen bg-bg-deep/50">

      {/* Ingredient slots */}
      <Card variant="surface">
        <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-3">
          Ingredients ({selectedIds.length}/{MAX_INGREDIENTS})
        </h2>
        <div className="flex gap-3">
          {Array.from({ length: MAX_INGREDIENTS }).map((_, i) => {
            const um = selected[i]
            return (
              <div
                key={i}
                className={cn(
                  'w-24 h-32 rounded-lg border-2 flex flex-col items-center justify-center',
                  um
                    ? 'border-gold/40 bg-bg-elevated'
                    : 'border-dashed border-border bg-bg-deep',
                )}
              >
                {um ? (
                  <>
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-bg-surface">
                      <MonsterThumb artUrl={um.monster.artUrl} />
                    </div>
                    <p className="text-10 font-cinzel text-text-primary mt-1 truncate max-w-full px-1 text-center">
                      {um.monster.name}
                    </p>
                    <button
                      onClick={() => toggleSelect(um.id)}
                      className="text-10 text-danger hover:underline"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-text-disabled text-20">+</span>
                    <span className="text-text-disabled text-9 text-center leading-tight">Tap to select</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selectedIds.length >= 2 && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!preview?.resultMonster || performMutation.isPending}
            className={cn(
              'mt-3 w-full py-2 rounded-md font-medium text-14 transition-colors',
              'bg-gold text-bg-deep hover:bg-gold-bright',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {performMutation.isPending ? 'Fusing…' : 'Fuse Monsters'}
          </button>
        )}
      </Card>

      {/* Preview result */}
      {selectedIds.length >= 2 && (
        <Card variant="surface">
          <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-3">
            Fusion Result
          </h2>
          {previewLoading && <p className="text-13 text-text-tertiary">Calculating…</p>}
          {!previewLoading && preview && (
            <div>
              {preview.resultMonster ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-bg-elevated">
                    <MonsterThumb artUrl={preview.resultMonster.artUrl} />
                  </div>
                  <div>
                    <p className="font-cinzel font-semibold text-14 text-text-primary">
                      {preview.resultMonster.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <RarityBadge rarity={preview.resultMonster.rarity} size="xs" />
                      {preview.isCrossRealm && (
                        <span className="text-10 text-gold bg-gold/10 rounded-pill px-1.5 py-0.5 uppercase tracking-wider">
                          Cross-Realm
                        </span>
                      )}
                    </div>
                    <p className="text-12 text-text-secondary mt-0.5">
                      Success rate: {preview.successRate}%
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-13 text-text-tertiary">
                  No named recipe found. Result will be determined by elemental fusion rules.
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Monster selection grid */}
      <div>
        <h2 className="font-cinzel font-semibold text-14 text-text-secondary uppercase tracking-wider mb-2">
          Select Monsters
        </h2>
        {monsters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-48 mb-2" aria-hidden="true">⚗</p>
            <p className="text-14 text-text-tertiary">
              No monsters available for fusion.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {monsters.map((um) => (
              <div
                key={um.id}
                className={cn(
                  'relative cursor-pointer',
                  selectedIds.includes(um.id) && 'ring-2 ring-gold rounded-lg',
                )}
                onClick={() => toggleSelect(um.id)}
              >
                <MonsterCard userMonster={um} view="grid" />
                {selectedIds.includes(um.id) && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center text-bg-deep text-10 font-bold">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation modal — uses shared Modal component */}
      <Modal
        isOpen={showConfirm && !!preview?.resultMonster}
        onClose={() => setShowConfirm(false)}
        title="Confirm Fusion"
        className="max-w-sm"
      >
        <p className="text-13 text-text-secondary mb-4">
          The following monsters will be consumed:
        </p>
        <ul className="space-y-1 mb-4">
          {selected.map((um) => (
            <li key={um.id} className="text-13 text-text-primary">
              • {um.monster.name}
            </li>
          ))}
        </ul>
        <p className="text-13 text-warning mb-4">
          This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 py-2 rounded-md bg-bg-surface text-text-secondary hover:bg-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => performMutation.mutate(selectedIds)}
            disabled={performMutation.isPending}
            className="flex-1 py-2 rounded-md bg-gold text-bg-deep hover:bg-gold-bright transition-colors disabled:opacity-50"
          >
            {performMutation.isPending ? 'Fusing…' : 'Confirm'}
          </button>
        </div>
      </Modal>
    </AnimatedPage>
  )
}
