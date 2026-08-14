import { create } from 'zustand'

export interface IMMessage {
  id: string
  from: string
  content: string
  timestamp: number
  type: 'text' | 'image' | 'file'
  isOwn: boolean
}

interface IMState {
  isConnected: boolean
  activeChannel: string | null
  unreadCounts: Record<string, number>
  messages: Record<string, IMMessage[]>
  isModalOpen: boolean
  setConnected: (connected: boolean) => void
  openIM: (channelId: string) => void
  closeIM: () => void
  addMessage: (channelId: string, msg: IMMessage) => void
  markRead: (channelId: string) => void
  incrementUnread: (channelId: string) => void
}

export const useIMStore = create<IMState>((set) => ({
  isConnected: false,
  activeChannel: null,
  // No default unread counts for user-facing pages — remove visible mock badges
  unreadCounts: {},
  messages: {},
  isModalOpen: false,
  setConnected: (connected) => set({ isConnected: connected }),
  openIM: (channelId) => set({ activeChannel: channelId, isModalOpen: true }),
  closeIM: () => set({ isModalOpen: false, activeChannel: null }),
  addMessage: (channelId, msg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [...(state.messages[channelId] ?? []), msg],
      },
    })),
  markRead: (channelId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [channelId]: 0 },
    })),
  incrementUnread: (channelId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [channelId]: (state.unreadCounts[channelId] ?? 0) + 1,
      },
    })),
}))
