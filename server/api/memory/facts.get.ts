export default defineEventHandler(async (event) => {
  const userId = await getCurrentUserId(event)
  return listFacts(userId)
})
