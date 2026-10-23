import type { PrismaClient } from '@supplier-price-control/db'
import { z } from 'zod'

export const pilotInput = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  displayName: z.string().trim().min(1).max(200),
})

export async function provisionPilot(db: PrismaClient, input: unknown) {
  const data = pilotInput.parse(input)
  // Existing accounts are not reactivated, reverified or granted new membership.
  return db.user.upsert({ where: { email: data.email }, create: data, update: {} })
}
