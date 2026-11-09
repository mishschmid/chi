export default defineEventHandler(async (event) => {
  const userId = await getCurrentUserId(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fact id' })
  }

  const success = await deleteFact(userId, id)
  if (!success) {
    throw createError({ statusCode: 404, statusMessage: 'Fact not found' })
  }

  return { success: true }
})
