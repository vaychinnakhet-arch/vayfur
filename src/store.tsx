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
  error: string | null;
  syncData: () => Promise<void>;
  saveLayout: (roomType: string, layout: any[]) => Promise<void>;
  forceInitialize: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxX6KGd5rRq03XhyokfF25VDCgrb7J9ZM3-Xl6riNCfvg2UgjYn3qzALDP70cFce0nL/exec';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [language, setLanguageState] = useState<Language>('en');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const gasUrl = GAS_URL;

  const forceInitialize = async () => {
    if (!gasUrl) return;
    setIsSyncing(true);
    setError(null);
    try {
      console.log('Forcing database initialization...');
      const initialData = generateInitialData();
      setRooms(initialData);
      localStorage.setItem('vay-chinnakhet-data', JSON.stringify(initialData));

      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'saveAll', rooms: initialData }),
        redirect: 'follow',
      });
      console.log('Database initialized successfully');
    } catch (err: any) {
      console.error('Failed to initialize:', err);
      setError('Failed to initialize database: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

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
          credentials: 'omit',
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
    setError(null);

    const tryFetch = async (url: string, options: RequestInit) => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        if (text.trim().startsWith('<!DOCTYPE html>') || text.includes('Google Drive - Access Denied')) {
           throw new Error('HTML_RESPONSE');
        }
        throw new Error('INVALID_JSON: ' + text.substring(0, 50));
      }
    };

    try {
      const fetchUrl = `${gasUrl}?action=getRooms&_t=${Date.now()}`;
      let result;

      // Attempt 1: GET with credentials: 'omit' (Best for CORS with GAS)
      try {
        console.log('Sync Attempt 1: GET omit');
        result = await tryFetch(fetchUrl, {
          method: 'GET',
          redirect: 'follow',
          credentials: 'omit',
        });
      } catch (e1: any) {
        console.warn('Attempt 1 failed:', e1);
        
        // Attempt 2: Standard GET
        try {
          console.log('Sync Attempt 2: GET standard');
          result = await tryFetch(fetchUrl, {
            method: 'GET',
            redirect: 'follow',
          });
        } catch (e2: any) {
          console.warn('Attempt 2 failed:', e2);

          // Attempt 3: POST (Fallback)
          try {
            console.log('Sync Attempt 3: POST');
            result = await tryFetch(gasUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({ action: 'getRooms' }),
              redirect: 'follow',
            });
          } catch (e3: any) {
            console.error('All sync attempts failed:', e3);
            
            let errorMessage = 'Network error: Unable to connect to server.';
            if (e1.message === 'HTML_RESPONSE' || e2.message === 'HTML_RESPONSE' || e3.message === 'HTML_RESPONSE') {
              errorMessage = 'Access Denied. Please check "Who has access" is set to "Anyone" in GAS deployment.';
            } else if (e3.message.startsWith('INVALID_JSON')) {
              errorMessage = 'Server returned invalid data. ' + e3.message;
            }
            
            throw new Error(errorMessage);
          }
        }
      }
      
      // Handle layouts if returned from GAS
      if (result.layouts) {
        Object.keys(result.layouts).forEach(type => {
          localStorage.setItem(`floorplan_areas_${type}`, JSON.stringify(result.layouts[type]));
        });
      }

      if (result.success && result.rooms) {
        // ... (rest of the logic remains the same)
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

          // Fix specific Google Sheets "1Am" -> "1:00" conversion (handle without healing to avoid write-back loop)
          if (normalizedType === '1:00' || normalizedType === '01:00') {
            normalizedType = '1Am';
          }

          // Aggressive check for Date strings or corrupted data
          const isDateString = normalizedType.length > 10 && (
            normalizedType.includes('1899') || 
            normalizedType.includes('1970') || 
            normalizedType.includes('GMT') ||
            normalizedType.includes('Sat') ||
            normalizedType.includes('Sun') ||
            normalizedType.includes('Mon') ||
            normalizedType.includes('Tue') ||
            normalizedType.includes('Wed') ||
            normalizedType.includes('Thu') ||
            normalizedType.includes('Fri') ||
            normalizedType.includes(':00:00')
          );

          if (normalizedType === 'undefined' || !normalizedType || isDateString) {
            // needsHealing = true; // DISABLE HEALING: Writing back "1Am" to an unformatted sheet just causes it to revert to "1:00" again.
            // Just fix it in memory for now.
            
            // It got corrupted by Google Sheets. Let's try to recover based on room ID (e.g. "202")
            // Use room.id instead of unitNo because unitNo might be just "2"
            const roomIdStr = String(room.id);
            const roomNum = parseInt(roomIdStr.slice(-2), 10);
            const floorNum = parseInt(roomIdStr.slice(0, -2), 10);
            
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

          // Map over the DEFINITION list (currentFurnitureList) to ensure we have all items
          // and fill in status from the saved data (room.furniture)
          const mergedFurniture = currentFurnitureList.map((definition, index) => {
             const savedItems = room.furniture || [];
             
             // Find matching item in saved data
             // Priority: 
             // 1. Exact Code Match (Highest Priority)
             // 2. Case-insensitive Code Match
             // 3. Name Match
             // 4. Migration Hack (Lowest Priority)
             
             let savedItem = savedItems.find((f: any) => f.code === definition.code);
             
             if (!savedItem) {
                savedItem = savedItems.find((f: any) => f.code && f.code.toLowerCase() === definition.code.toLowerCase());
             }
             
             if (!savedItem) {
                savedItem = savedItems.find((f: any) => f.name === definition.name);
             }
             
             if (!savedItem && definition.code.startsWith('F-06')) {
                 // Only fall back to F-06 if exact match wasn't found
                 savedItem = savedItems.find((f: any) => f.code === 'F-06');
             }
             
             return {
               id: savedItem ? savedItem.id : `f-${index}`,
               code: definition.code,
               name: definition.name,
               imageUrl: definition.imageUrl,
               status: savedItem ? (savedItem.status || 'pending') : 'pending',
               installProgress: savedItem ? (savedItem.installProgress || 0) : 0,
               notes: savedItem ? (savedItem.notes || '') : '',
               images: savedItem ? (savedItem.images || []) : []
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
        // If sheet is empty, generate fresh initial data and save it
        console.log('Database is empty. Initializing with default data...');
        const initialData = generateInitialData();
        
        // Update local state
        setRooms(initialData);
        localStorage.setItem('vay-chinnakhet-data', JSON.stringify(initialData));

        // Save to GAS
        await fetch(gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({ action: 'saveAll', rooms: initialData }),
          redirect: 'follow',
        });
      } else {
        console.error('Server returned error:', result.message);
        setError(result.message || 'Unknown server error');
      }
    } catch (error: any) {
      console.error('Failed to sync data:', error);
      setError(error.message || 'Failed to sync data');
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
      error,
      syncData,
      saveLayout,
      forceInitialize
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
