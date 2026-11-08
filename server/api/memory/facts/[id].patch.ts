export default defineEventHandler(async (event) => {
  const userId = getCurrentUserId(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fact id' })
  }

  const body = await readBody<{ fact?: unknown }>(event)
  const fact = typeof body?.fact === 'string' ? body.fact.trim() : ''

  if (!fact) {
    throw createError({ statusCode: 400, statusMessage: 'Fact content cannot be empty' })
  }

  const updated = await updateFact(userId, id, fact)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Fact not found' })
  }

  return updated
})
