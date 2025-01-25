import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { type Either, makeRight } from '@/shared/either'
import { z } from 'zod'
import { ilike, asc, desc, count } from 'drizzle-orm'

const getUploadsInput = z.object({
  searchQuery: z.string().optional(),
  sortBy: z.enum(['createdAt']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(20),
})

type GetUploadsInput = z.input<typeof getUploadsInput>

type GetUploadOutput = {
  uploads: {
    id: string
    name: string
    remoteKey: string
    remoteUrl: string
    createdAt: Date
  }[]
  total: number
}

export async function getUploads(
  input: GetUploadsInput
): Promise<Either<never, GetUploadOutput>> {
  const { searchQuery, sortBy, sortDirection, page, pageSize } =
    getUploadsInput.parse(input)

  const uploadsQuery = db
    .select({
      id: schema.uploads.id,
      name: schema.uploads.name,
      remoteKey: schema.uploads.remoteKey,
      remoteUrl: schema.uploads.remoteUrl,
      createdAt: schema.uploads.createdAt,
    })
    .from(schema.uploads)
    .where(
      searchQuery ? ilike(schema.uploads.name, `%${searchQuery}%`) : undefined
    )
    .orderBy(fields => {
      if (sortBy && sortDirection === 'asc') {
        return asc(fields[sortBy])
      }

      if (sortBy && sortDirection === 'desc') {
        return desc(fields[sortBy])
      }

      return asc(fields.id)
    })
    .offset((page - 1) * pageSize)
    .limit(pageSize)

  const totalQuery = db
    .select({ total: count(schema.uploads.id) })
    .from(schema.uploads)
    .where(
      searchQuery ? ilike(schema.uploads.name, `%${searchQuery}%`) : undefined
    )

  const [uploads, [{ total }]] = await Promise.all([uploadsQuery, totalQuery])

  return makeRight({ uploads, total })
}
