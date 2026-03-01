import React, { createContext, useContext, useEffect, useState } from 'react';
import { Room, generateInitialData, ItemStatus, getFurnitureListForType } from './data';
import { Language, t } from './i18n';

interface AppContextType {
  rooms: Room[];
  updateFurnitureStatus: (roomId: string, furnitureId: string, status: ItemStatus, notes?: string, images?: string[]) => void;
  updateFurnitureProgress: (roomId: string, furnitureId: string, progress: number) => void;
  resetData: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const storedData = localStorage.getItem('vay-chinnakhet-data');
    if (storedData) {
      // Ensure old data has installProgress and updated image URLs
      const parsedData = JSON.parse(storedData);
      const updatedData = parsedData.map((room: Room) => {
        const currentFurnitureList = getFurnitureListForType(room.type);
        
        return {
          ...room,
          furniture: currentFurnitureList.map((item, index) => {
            // Try to find matching item in saved data to preserve status
            // Match by code, or if not found, try to match by name or partial code
            const existingItem = room.furniture.find(f => 
              f.code === item.code || 
              (item.code.startsWith('F-06') && f.code === 'F-06') || // Handle F-06 split
              f.name === item.name
            );

            return {
              id: `f-${index}`, // Regenerate ID to match current list order
              code: item.code,
              name: item.name,
              imageUrl: item.imageUrl,
              status: existingItem ? existingItem.status : 'pending',
              installProgress: existingItem ? (existingItem.installProgress !== undefined ? existingItem.installProgress : (existingItem.status === 'installed' ? 100 : 0)) : 0
            };
          })
        };
      });
      setRooms(updatedData);
    } else {
      const initialData = generateInitialData();
      setRooms(initialData);
      localStorage.setItem('vay-chinnakhet-data', JSON.stringify(initialData));
    }

    const storedLang = localStorage.getItem('vay-chinnakhet-lang') as Language;
    if (storedLang && (storedLang === 'en' || storedLang === 'th')) {
      setLanguageState(storedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vay-chinnakhet-lang', lang);
  };

  const translate = (key: string, params?: Record<string, any>) => {
    return t(language, key, params);
  };

  const updateFurnitureStatus = (roomId: string, furnitureId: string, status: ItemStatus, notes?: string, images?: string[]) => {
    setRooms(prevRooms => {
      const newRooms = prevRooms.map(room => {
        if (room.id === roomId) {
          return {
            ...room,
            furniture: room.furniture.map(f => {
              if (f.id === furnitureId) {
                let newProgress = f.installProgress;
                if (status === 'installed') newProgress = 100;
                if (status === 'delivered' || status === 'pending') newProgress = 0;
                if (status === 'installing' && newProgress === 0) newProgress = 10;
                
                const updatedItem = { ...f, status, installProgress: newProgress };
                if (notes !== undefined) updatedItem.notes = notes;
                if (images !== undefined) updatedItem.images = images;
                
                return updatedItem;
              }
              return f;
            }),
          };
        }
        return room;
      });
      localStorage.setItem('vay-chinnakhet-data', JSON.stringify(newRooms));
      return newRooms;
    });
  };

  const updateFurnitureProgress = (roomId: string, furnitureId: string, progress: number) => {
    setRooms(prevRooms => {
      const newRooms = prevRooms.map(room => {
        if (room.id === roomId) {
          return {
            ...room,
            furniture: room.furniture.map(f => {
              if (f.id === furnitureId) {
                let newStatus = f.status;
                if (progress === 100) newStatus = 'installed';
                else if (progress > 0 && progress < 100) newStatus = 'installing';
                else if (progress === 0 && (f.status === 'installing' || f.status === 'installed')) newStatus = 'delivered';
                
                return { ...f, installProgress: progress, status: newStatus };
              }
              return f;
            }),
          };
        }
        return room;
      });
      localStorage.setItem('vay-chinnakhet-data', JSON.stringify(newRooms));
      return newRooms;
    });
  };

  const resetData = () => {
    const initialData = generateInitialData();
    setRooms(initialData);
    localStorage.setItem('vay-chinnakhet-data', JSON.stringify(initialData));
  };

  return (
    <AppContext.Provider value={{ 
      rooms, 
      updateFurnitureStatus, 
      updateFurnitureProgress,
      resetData,
      language,
      setLanguage,
      t: translate
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
