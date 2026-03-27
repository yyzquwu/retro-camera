import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PolaroidPhoto {
  id: string;
  src: string;
  date: string;
  caption: string;
  rotation: number;
  x: number;
  y: number;
}

export interface Room {
  id: string;
  name: string;
  type: 'event' | 'journal' | 'brand';
  host: string;
  subtitle: string;
  prompt: string;
  photos: PolaroidPhoto[];
}

interface RetroStore {
  rooms: Room[];
  currentRoomId: string | null;
  addRoom: (room: Room) => void;
  deleteRoom: (id: string) => void;
  setCurrentRoom: (id: string | null) => void;
  addPhotoToRoom: (roomId: string, photo: PolaroidPhoto) => void;
}

export const useRetroStore = create<RetroStore>()(
  persist(
    (set) => ({
      rooms: [
        {
          id: 'demo-room',
          name: 'Demo Room',
          type: 'event',
          host: 'Retro Admin',
          subtitle: 'Welcome to your first room!',
          prompt: 'Capture a moment you want to keep forever.',
          photos: []
        }
      ],
      currentRoomId: null,
      addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
      deleteRoom: (id) => set((state) => ({ rooms: state.rooms.filter((r) => r.id !== id) })),
      setCurrentRoom: (id) => set({ currentRoomId: id }),
      addPhotoToRoom: (roomId, photo) => set((state) => ({
        rooms: state.rooms.map((room) => 
          room.id === roomId 
            ? { ...room, photos: [...room.photos, photo] } 
            : room
        )
      }))
    }),
    {
      name: 'retro-storage',
    }
  )
);
