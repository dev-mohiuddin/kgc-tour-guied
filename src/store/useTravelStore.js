import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTravelStore = create(
  persist(
    (set, get) => ({
      selectedPlaces: [],
      savedRoutes: [],
      currentRoute: null,
      language: 'en',
      
      setSelectedPlaces: (places) => set({ selectedPlaces: places }),
      
      addPlace: (place) => {
        const current = get().selectedPlaces;
        const exists = current.find((p) => p._id === place._id);
        if (!exists) {
          set({ selectedPlaces: [...current, place] });
        }
      },
      
      removePlace: (placeId) => {
        const current = get().selectedPlaces;
        set({
          selectedPlaces: current.filter((p) => p._id !== placeId),
        });
      },
      
      clearPlaces: () => set({ selectedPlaces: [] }),
      
      setCurrentRoute: (route) => set({ currentRoute: route }),
      
      addSavedRoute: (route) => {
        const current = get().savedRoutes;
        set({ savedRoutes: [...current, route] });
      },
      
      setLanguage: (lang) => set({ language: lang }),
      
      getLanguage: () => get().language,
    }),
    {
      name: 'kgc-travel-storage',
    }
  )
);
