import cron from 'node-cron'
import { prisma } from './prisma.js'

/**
 * Schedules all recurring background jobs for SummonScroll.
 * Call `startScheduler()` once during server startup.
 */
export function startScheduler(): void {
  // ── Daily reset — midnight UTC ─────────────────────────────────────────────
  // Resets `completedToday` on all Daily records so users can complete them again.
  cron.schedule(
    '0 0 * * *',
    async () => {
      const timestamp = new Date().toISOString()
      console.log(`[scheduler] ${timestamp} — Running daily reset...`)
      try {
        const result = await prisma.daily.updateMany({
          data: { completedToday: false },
        })
        console.log(`[scheduler] ${timestamp} — Daily reset complete. Updated ${result.count} records.`)
      } catch (err) {
        console.error(`[scheduler] ${timestamp} — Daily reset FAILED:`, err)
      }
    },
    {
      timezone: 'UTC',
    },
  )

  console.log('[scheduler] Daily reset cron registered (0 0 * * * UTC)')
}
