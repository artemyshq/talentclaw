import { ChatPage } from "@/components/chat/chat-page"

export default async function ChatSlugRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ChatPage initialSlug={slug} />
}
