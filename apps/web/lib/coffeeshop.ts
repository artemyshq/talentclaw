import { CoffeeShopClient } from "@artemyshq/coffeeshop"

let _client: CoffeeShopClient | null = null

function getClient(): CoffeeShopClient {
  if (!_client) {
    _client = new CoffeeShopClient({
      baseUrl: process.env.COFFEESHOP_URL || "https://coffeeshop.artemys.dev",
      apiKey: process.env.COFFEESHOP_API_KEY,
      agentId: process.env.COFFEESHOP_AGENT_ID,
    })
  }
  return _client
}

export async function searchJobs(filters?: {
  skills?: string[]
  location?: string
  remote?: boolean
  min_compensation?: number
  max_compensation?: number
  limit?: number
}) {
  const client = getClient()
  return client.searchJobs(filters)
}

export async function submitApplication(
  jobId: string,
  snapshot: Record<string, unknown>,
  reasoning?: string
) {
  const client = getClient()
  return client.submitApplication(jobId, snapshot, reasoning)
}

export async function getInbox(options?: { unread_only?: boolean }) {
  const client = getClient()
  return client.getInbox(options)
}

export async function respondToMessage(
  messageId: string,
  content: Record<string, unknown>,
  messageType?: string
) {
  const client = getClient()
  return client.respondToMessage(messageId, content, messageType)
}
