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
  gasUrl: string;
  isSyncing: boolean;
  syncData: () => Promise<void>;
  saveLayout: (roomType: string, layout: any[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwhaJ6KA1HGw2Z7Qw5m927uTs_ElwUpfR8253CaNPeQTu90z0WCTDTsmOwS3cJtVKTA/exec';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [language, setLanguageState] = useState<Language>('en');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const gasUrl = GAS_URL;

  const saveLayout = async (roomType: string, layout: any[]) => {
    // Save locally first
    localStorage.setItem(`floorplan_areas_${roomType}`, JSON.stringify(layout));
    
    // Then try to save to GAS
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            action: 'saveLayout',
            roomType: roomType,
            layout: layout
          }),
          redirect: 'follow',
        });
      } catch (error) {
        console.error('Failed to save layout to GAS:', error);
      }
    }
  };

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

  const syncData = async () => {
    if (!gasUrl) return;
    setIsSyncing(true);
    try {
      // Use GET for loading data as per the new Apps Script structure
      const response = await fetch(gasUrl, {
        method: 'GET',
        redirect: 'follow',
      });
      const result = await response.json();
      
      // Handle layouts if returned from GAS
      if (result.layouts) {
        Object.keys(result.layouts).forEach(type => {
          localStorage.setItem(`floorplan_areas_${type}`, JSON.stringify(result.layouts[type]));
        });
      }

      if (result.success && result.rooms && result.rooms.length > 0) {
        let needsHealing = false;

        // Sanitize data from GAS and merge with local definitions to get images
        const sanitizedRooms = result.rooms.map((room: any) => {
          let unitNo = String(room.unitNo);
          if (unitNo === 'undefined' || !unitNo) {
            unitNo = String(room.id);
            needsHealing = true;
          }

          // Check for Google Sheets time/date format issues in unitNo
          if (unitNo.includes('1899-12-')) {
             try {
               const date = new Date(unitNo);
               if (!isNaN(date.getTime())) {
                 const hours = date.getHours().toString().padStart(2, '0');
                 const minutes = date.getMinutes().toString().padStart(2, '0');
                 unitNo = `${hours}:${minutes}`;
                 needsHealing = true;
               }
             } catch (e) {
               // keep original
             }
          }

          // Check for Google Sheets time/date format issues in type (e.g. "1Am" converted to time)
          let normalizedType = String(room.type || '1A').trim();
          if (normalizedType === 'undefined' || !normalizedType || normalizedType.includes('1899-12-') || normalizedType.includes('1970-01-')) {
            needsHealing = true;
            // It got corrupted by Google Sheets. Let's try to recover based on room ID (e.g. "202")
            const roomNum = parseInt(unitNo.slice(-2), 10);
            const floorNum = parseInt(unitNo.slice(0, -2), 10);
            
            if (!isNaN(roomNum) && !isNaN(floorNum)) {
              if (floorNum === 2) {
                const floor2Types = ['1A', '1Am', '1A', '1Am', '1A', '1Am', '1B', '1Am', '1A', '1Am', '1A', '1Am', '1A', '1Am', '1A', '1A-1m', '1A', '1Am'];
                normalizedType = floor2Types[roomNum - 1] || '1A';
              } else {
                const floor3to8Types = ['1A', '1Am', '1A', '1Am', '1A', '1Am', '1B', '1Am', '1A', '1Am', '1A', '1Am', '1A', '1Am', '1A', '1A', '1Am', '1A', '1A-1m', '1A', '1Am'];
                normalizedType = floor3to8Types[roomNum - 1] || '1A';
              }
            } else {
              normalizedType = '1Am'; // Fallback
            }
          }

          // Helper to get list with loose matching if exact type not found
          let currentFurnitureList = getFurnitureListForType(normalizedType);
          
          // If the type didn't return a specific list (got default), try to find a better match
          // e.g. if sheet has "1a" but data has "1A"
          if (currentFurnitureList.length === 0 || (currentFurnitureList === getFurnitureListForType('unknown') && normalizedType !== 'unknown')) {
             if (normalizedType.toLowerCase() === '1a') currentFurnitureList = getFurnitureListForType('1A');
             else if (normalizedType.toLowerCase() === '1am') currentFurnitureList = getFurnitureListForType('1Am');
             else if (normalizedType.toLowerCase() === '1b') currentFurnitureList = getFurnitureListForType('1B');
          }

          const mergedFurniture = (room.furniture || []).map((item: any, index: number) => {
             const itemCode = String(item.code || '').trim();
             
             // Find matching definition to get the image
             // Priority: 
             // 1. Exact Code Match
             // 2. Case-insensitive Code Match
             // 3. Name Match
             // 4. Index fallback
             const definition = 
                currentFurnitureList.find(d => d.code === itemCode) || 
                currentFurnitureList.find(d => d.code.toLowerCase() === itemCode.toLowerCase()) ||
                currentFurnitureList.find(d => d.name === item.name) ||
                currentFurnitureList[index];
             
             return {
               ...item,
               code: itemCode || (definition ? definition.code : ''),
               name: item.name || (definition ? definition.name : ''),
               imageUrl: (definition ? definition.imageUrl : item.imageUrl) || '',
               status: item.status || 'pending',
               installProgress: item.installProgress || 0,
               notes: item.notes || '',
               images: item.images || []
             };
          });
          
          return {
            ...room,
            unitNo: unitNo,
            floor: Number(room.floor) || 0,
            type: normalizedType,
            furniture: mergedFurniture
          };
        });

        setRooms(sanitizedRooms);
        localStorage.setItem('vay-chinnakhet-data', JSON.stringify(sanitizedRooms));

        // Auto-heal the database if corruption was detected
        if (needsHealing) {
          console.log('Data corruption detected. Auto-healing database...');
          fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'saveAll', rooms: sanitizedRooms }),
            redirect: 'follow'
          }).catch(err => console.error('Auto-heal failed:', err));
        }
      } else if (result.success && (!result.rooms || result.rooms.length === 0)) {
        // If sheet is empty, save current local data to sheet
        await fetch(gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({ action: 'saveAll', rooms }),
          redirect: 'follow',
        });
      }
    } catch (error) {
      console.error('Failed to sync data:', error);
      alert('Failed to sync data. Please check your internet connection or Google Apps Script URL.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Load from GAS when URL is set or on mount if URL exists
  useEffect(() => {
    if (gasUrl) {
      syncData();
    }
  }, [gasUrl]);

  const translate = (key: string, params?: Record<string, any>) => {
    return t(language, key, params);
  };

  const updateFurnitureStatus = async (roomId: string, furnitureId: string, status: ItemStatus, notes?: string, images?: string[]) => {
    let updatedFurnitureItem: any = null;
    
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
                
                updatedFurnitureItem = updatedItem;
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

    if (gasUrl && updatedFurnitureItem) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            action: 'updateStatus',
            roomId,
            furniture: updatedFurnitureItem
          }),
          redirect: 'follow',
        });
      } catch (error) {
        console.error('Failed to update GAS:', error);
      }
    }
  };

  const updateFurnitureProgress = async (roomId: string, furnitureId: string, progress: number) => {
    let updatedFurnitureItem: any = null;

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
                
                const updatedItem = { ...f, installProgress: progress, status: newStatus };
                updatedFurnitureItem = updatedItem;
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

    if (gasUrl && updatedFurnitureItem) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({
            action: 'updateStatus',
            roomId,
            furniture: updatedFurnitureItem
          }),
          redirect: 'follow',
        });
      } catch (error) {
        console.error('Failed to update GAS:', error);
      }
    }
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
      t: translate,
      gasUrl,
      isSyncing,
      syncData,
      saveLayout
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
