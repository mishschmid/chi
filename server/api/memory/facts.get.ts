export default defineEventHandler(async (event) => {
  const userId = getCurrentUserId(event)
  return listFacts(userId)
})
