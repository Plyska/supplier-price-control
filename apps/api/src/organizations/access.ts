import type { MembershipRole, PrismaClient } from '@supplier-price-control/db'
import { HttpError } from '../http/http-error.js'

export type OrganizationPermission = 'read' | 'write' | 'owner'
export type OrganizationContext = {
  organizationId: string
  role: MembershipRole
  userId: string
}

const permittedRoles: Record<OrganizationPermission, readonly MembershipRole[]> = {
  read: ['viewer', 'editor', 'owner'],
  write: ['editor', 'owner'],
  owner: ['owner'],
}

export async function requireOrganizationContext(
  database: PrismaClient,
  userId: string,
  organizationId: string,
  permission: OrganizationPermission,
): Promise<OrganizationContext> {
  const membership = await database.membership.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  })

  if (!membership || membership.revokedAt) {
    throw new HttpError(404, 'NOT_FOUND', 'Organization not found')
  }
  if (!permittedRoles[permission].includes(membership.role)) {
    throw new HttpError(403, 'FORBIDDEN', 'Permission denied')
  }

  return { organizationId, role: membership.role, userId }
}
