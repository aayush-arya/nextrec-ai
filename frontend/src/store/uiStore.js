import { create } from 'zustand'

const useUIStore = create((set) => ({
  activeDomain: 'movies',
  activeMood: null,
  sidebarOpen: false,

  setActiveDomain: (domain) => set({ activeDomain: domain }),
  setActiveMood: (mood) => set({ activeMood: mood }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}))

export default useUIStore
