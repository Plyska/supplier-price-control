import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'

type DatabaseOptions = {
  connectionString: string
  maxConnections?: number
}

// The process composition root owns one client and disconnects it on shutdown.
// Do not construct clients in request handlers or load migration credentials here.
export function createDatabase({
  connectionString,
  maxConnections = 5,
}: DatabaseOptions) {
  const adapter = new PrismaPg(
    {
      connectionString,
      max: maxConnections,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      statement_timeout: 10_000,
    },
    { schema: 'app' },
  )

  return new PrismaClient({ adapter })
}

export { Prisma, PrismaClient } from './generated/prisma/client.js'
export { MembershipRole } from './generated/prisma/enums.js'
