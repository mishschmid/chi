export interface ConversationItem {
  id: string
  userId: string
  title: string | null
  createdAt: string
  updatedAt: string
}

export interface MessageItem {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string | null
  createdAt?: string
}

export function useChat() {
  const conversations = ref<ConversationItem[]>([])
  const activeConversationId = ref<string | null>(null)
  const messages = ref<MessageItem[]>([])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  async function loadConversations() {
    error.value = null
    try {
      const data = await $fetch<ConversationItem[]>('/api/conversations')
      conversations.value = data
      const first = data[0]
      if (first && !activeConversationId.value) {
        await selectConversation(first.id)
      }
    } catch (e: any) {
      error.value = e?.statusMessage || 'Failed to load conversations'
    }
  }

  async function selectConversation(id: string) {
    if (isStreaming.value) return
    activeConversationId.value = id
    error.value = null
    try {
      const msgs = await $fetch<MessageItem[]>(`/api/conversations/${id}/messages`)
      messages.value = msgs
    } catch (e: any) {
      error.value = e?.statusMessage || 'Failed to load messages'
    }
  }

  async function createConversation(): Promise<string | null> {
    if (isStreaming.value) return null
    error.value = null
    try {
      const created = await $fetch<ConversationItem>('/api/conversations', {
        method: 'POST',
      })
      conversations.value.unshift(created)
      activeConversationId.value = created.id
      messages.value = []
      return created.id
    } catch (e: any) {
      error.value = e?.statusMessage || 'Failed to create conversation'
      return null
    }
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim()
    if (!trimmed || isStreaming.value) return

    error.value = null

    let convId = activeConversationId.value
    if (!convId) {
      convId = await createConversation()
      if (!convId) return
    }

    // Optimistically add user message
    messages.value.push({
      role: 'user',
      content: trimmed,
    })

    // Placeholder assistant message for streaming
    const assistantMsgIndex = messages.value.length
    messages.value.push({
      role: 'assistant',
      content: '',
    })

    isStreaming.value = true

    try {
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ content: trimmed }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        const target = messages.value[assistantMsgIndex]
        if (target) {
          target.content += text
        }
      }

      // Refresh conversations list to pick up updated title & order
      const updatedList = await $fetch<ConversationItem[]>('/api/conversations')
      conversations.value = updatedList
    } catch (e: any) {
      error.value = e?.message || 'Error while receiving response'
      const target = messages.value[assistantMsgIndex]
      if (target && !target.content) {
        messages.value.splice(assistantMsgIndex, 1)
      }
    } finally {
      isStreaming.value = false
    }
  }

  return {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    error,
    loadConversations,
    selectConversation,
    createConversation,
    sendMessage,
  }
}
