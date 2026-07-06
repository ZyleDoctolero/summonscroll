import { CurrencyIcon, CurrencyDisplay } from './CurrencyIcon'

/**
 * Example component demonstrating CurrencyIcon usage
 * This can be integrated into any page that needs to display currency
 */
export function CurrencyDisplayExample() {
  return (
    <div className="p-6 space-y-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Currency Icons</h2>
      
      {/* Individual Icons */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">Individual Icons</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CurrencyIcon name="spirit_crystals" size={32} />
            <span className="text-white">Spirit Crystals</span>
          </div>
          <div className="flex items-center gap-2">
            <CurrencyIcon name="void_shards" size={32} />
            <span className="text-white">Void Shards</span>
          </div>
          <div className="flex items-center gap-2">
            <CurrencyIcon name="pact_seals" size={32} />
            <span className="text-white">Pact Seals</span>
          </div>
        </div>
      </div>

      {/* Currency Display with Amounts */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">Currency Display with Amounts</h3>
        <div className="flex items-center gap-6">
          <CurrencyDisplay name="spirit_crystals" amount={1250} iconSize={24} className="text-white" />
          <CurrencyDisplay name="void_shards" amount={15} iconSize={24} className="text-white" />
          <CurrencyDisplay name="pact_seals" amount={3} iconSize={24} className="text-white" />
        </div>
      </div>

      {/* Different Sizes */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">Different Sizes</h3>
        <div className="flex items-center gap-4">
          <CurrencyIcon name="spirit_crystals" size={16} />
          <CurrencyIcon name="spirit_crystals" size={24} />
          <CurrencyIcon name="spirit_crystals" size={32} />
          <CurrencyIcon name="spirit_crystals" size={48} />
        </div>
      </div>

      {/* Error State (non-existent icon) */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-300">Error State (Fallback)</h3>
        <div className="flex items-center gap-4">
          <CurrencyIcon name="non_existent_icon" size={32} />
          <span className="text-gray-400">Non-existent icon shows fallback</span>
        </div>
      </div>
    </div>
  )
}
