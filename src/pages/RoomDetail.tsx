import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../store';
import { CheckCircle2, Hammer, Clock, ArrowLeft, Info, X, Edit3, Save, XCircle, Package } from 'lucide-react';
import { ItemStatus, getFloorPlanImage } from '../data';

export const RoomDetail: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { rooms, updateFurnitureStatus, updateFurnitureProgress, t, saveLayout, updateRoomFurnitureStatus, layouts } = useAppContext();
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState<ItemStatus | null>(null);
  const [tempProgress, setTempProgress] = useState<number | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [applyToAllSimilar, setApplyToAllSimilar] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAreaIndex, setEditingAreaIndex] = useState<number | null>(null);
  
  const room = rooms.find(r => r.id === roomId);

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('roomNotFound')}</h2>
        <Link to="/floors" className="text-indigo-600 hover:text-indigo-800">{t('backToFloors')}</Link>
      </div>
    );
  }

  const [isUpdating, setIsUpdating] = useState(false);

  const handleBatchUpdate = async (status: ItemStatus) => {
    let confirmMsg = '';
    if (status === 'installed') confirmMsg = 'confirmInstallAll';
    else if (status === 'delivered') confirmMsg = 'confirmDeliverAll';
    else if (status === 'pending') confirmMsg = 'confirmResetAll';

    if (window.confirm(t(confirmMsg))) {
      setIsUpdating(true);
      try {
        await updateRoomFurnitureStatus(room.id, status);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleStatusChange = (status: ItemStatus) => {
    setTempStatus(status);
    if (status === 'installed') setTempProgress(100);
    if (status === 'delivered') setTempProgress(0);
    if (status === 'pending') setTempProgress(0);
    if (status === 'installing' && tempProgress === 0) setTempProgress(10);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setTempProgress(val);
      if (val === 100) setTempStatus('installed');
      else if (val > 0 && val < 100) setTempStatus('installing');
      else if (val === 0) setTempStatus('delivered');
    }
  };

  const getBaseCode = (code: string) => {
    const parts = code.split('-');
    if (parts.length >= 3) {
      return parts.slice(0, 2).join('-');
    }
    return code;
  };

  const handleConfirmUpdate = () => {
    if (selectedFurnitureId && tempStatus !== null && tempProgress !== null) {
      const selectedFurniture = room.furniture.find(f => f.id === selectedFurnitureId);
      
      if (applyToAllSimilar && selectedFurniture) {
        const baseCode = getBaseCode(selectedFurniture.code);
        const similarItems = room.furniture.filter(f => getBaseCode(f.code) === baseCode);
        similarItems.forEach(item => {
          updateFurnitureStatus(room.id, item.id, tempStatus, tempNotes, tempImages);
          updateFurnitureProgress(room.id, item.id, tempProgress);
        });
      } else {
        updateFurnitureStatus(room.id, selectedFurnitureId, tempStatus, tempNotes, tempImages);
        updateFurnitureProgress(room.id, selectedFurnitureId, tempProgress);
      }
      
      setSelectedFurnitureId(null);
      setTempStatus(null);
      setTempProgress(null);
      setTempNotes('');
      setTempImages([]);
    }
  };

  const handleCancelUpdate = () => {
    setSelectedFurnitureId(null);
    setTempStatus(null);
    setTempProgress(null);
    setTempNotes('');
    setTempImages([]);
  };

  const openUpdateModal = (furnitureId: string) => {
    const furniture = room.furniture.find(f => f.id === furnitureId);
    if (furniture) {
      setSelectedFurnitureId(furnitureId);
      setTempStatus(furniture.status);
      setTempProgress(furniture.installProgress);
      setTempNotes(furniture.notes || '');
      setTempImages(furniture.images || []);
      
      const baseCode = getBaseCode(furniture.code);
      const similarCount = room.furniture.filter(f => getBaseCode(f.code) === baseCode).length;
      setApplyToAllSimilar(similarCount > 1);
    }
  };

  const totalItems = room.furniture.length;
  const installedItems = room.furniture.filter(f => f.status === 'installed').length;
  const progress = totalItems === 0 ? 0 : Math.round((installedItems / totalItems) * 100);

  const floorPlanUrl = getFloorPlanImage(room.type);

  const selectedFurniture = room.furniture.find(f => f.id === selectedFurnitureId);
  const similarItemsCount = selectedFurniture ? room.furniture.filter(f => getBaseCode(f.code) === getBaseCode(selectedFurniture.code)).length : 0;

  const getLayoutForType = (type: string) => {
    const layout1A = [
      { code: 'F-10', name: 'BED', top: '27%', left: '48%', width: '32%', height: '11%' },
      { code: 'F-14L', name: 'Wardrobe', top: '38%', left: '73%', width: '12%', height: '11%' },
      { code: 'F-06-1', name: 'DINING CHAIR 1', top: '45%', left: '63%', width: '10%', height: '6%' },
      { code: 'F-05', name: 'DINING TABLE', top: '45%', left: '73%', width: '12%', height: '6%' },
      { code: 'F-06-2', name: 'DINING CHAIR 2', top: '51%', left: '73%', width: '10%', height: '6%' },
      { code: 'F-01', name: 'SOFA', top: '55%', left: '63%', width: '15%', height: '13%' },
      { code: 'F-04', name: 'TV Console', top: '54%', left: '45%', width: '10%', height: '9%' },
      { code: 'F-09L', name: 'Shoe Cabinet', top: '64%', left: '45%', width: '10%', height: '6%' },
    ];

    if (type === '1A') return layout1A;

    if (type === '1Am') {
      // Mirror 1A and update codes for 1Am
      return layout1A.map(item => {
        const newItem = {
          ...item,
          left: `${100 - parseFloat(item.left) - parseFloat(item.width)}%`
        };
        if (newItem.code === 'F-14L') newItem.code = 'F-14R';
        if (newItem.code === 'F-09L') newItem.code = 'F-09R';
        return newItem;
      });
    }

    if (type === '1A-1m') {
      // 1A-1m uses Type A furniture (L-series), so it should follow 1A layout orientation
      return layout1A;
    }

    if (type === '1B') {
      return [
        { code: 'F-10', name: "BED 5'", top: '20%', left: '20%', width: '25%', height: '15%' },
        { code: 'F-10.1', name: "BED 3.5'", top: '20%', left: '55%', width: '20%', height: '15%' },
        { code: 'F-14R', name: 'Wardrobe', top: '40%', left: '10%', width: '12%', height: '10%' },
        { code: 'F-14.1L', name: 'Wardrobe', top: '40%', left: '80%', width: '12%', height: '10%' },
        { code: 'F-01', name: 'SOFA', top: '60%', left: '40%', width: '20%', height: '12%' },
        { code: 'F-05', name: 'DINING TABLE', top: '75%', left: '40%', width: '20%', height: '12%' },
        { code: 'F-04.1', name: 'TV Console', top: '90%', left: '40%', width: '20%', height: '6%' },
        { code: 'F-09L', name: 'Shoe Cabinet', top: '90%', left: '10%', width: '12%', height: '8%' },
        { code: 'F-06-1', name: 'DINING CHAIR 1', top: '72%', left: '35%', width: '8%', height: '8%' },
        { code: 'F-06-2', name: 'DINING CHAIR 2', top: '72%', left: '57%', width: '8%', height: '8%' },
        { code: 'F-06-3', name: 'DINING CHAIR 3', top: '80%', left: '35%', width: '8%', height: '8%' },
        { code: 'F-06-4', name: 'DINING CHAIR 4', top: '80%', left: '57%', width: '8%', height: '8%' },
      ];
    }

    return [];
  };

  const defaultClickableAreas = getLayoutForType(room.type);

  const [clickableAreas, setClickableAreas] = useState(defaultClickableAreas);

  useEffect(() => {
    if (!room) return;
    
    // If we are editing, don't overwrite with incoming data to avoid jumping
    if (isEditMode) return;

    // Priority: 1. Layouts from Context (Synced), 2. LocalStorage, 3. Default
    if (layouts && layouts[room.type]) {
      setClickableAreas(layouts[room.type]);
      return;
    }

    const saved = localStorage.getItem(`floorplan_areas_${room.type}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setClickableAreas(parsed);
        } else {
          setClickableAreas(getLayoutForType(room.type));
        }
      } catch (e) {
        console.error('Failed to parse saved areas');
        setClickableAreas(getLayoutForType(room.type));
      }
    } else {
      setClickableAreas(getLayoutForType(room.type));
    }
  }, [room?.type, layouts, isEditMode]);

  const handleSaveAreas = async () => {
    if (!room) return;
    await saveLayout(room.type, clickableAreas);
    setIsEditMode(false);
    setEditingAreaIndex(null);
  };

  const handleAreaChange = (index: number, field: string, value: string) => {
    const newAreas = [...clickableAreas];
    newAreas[index] = { ...newAreas[index], [field]: value + '%' };
    setClickableAreas(newAreas);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-5">
          <Link to={`/floors/${room.floor}`} className="p-2.5 rounded-full border border-slate-200 hover:border-[#cd3731] hover:bg-[#cd3731] hover:text-white transition-colors text-slate-500 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-semibold text-slate-500 block">Room</span>
              <span className="px-2 py-0.5 rounded-md border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-50">
                {room.type}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-1">{room.unitNo}</h1>
            <p className="text-slate-500 font-medium">Floor {room.floor}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 min-w-[200px]">
          <div className="w-full flex justify-between items-end">
            <div className="text-sm font-semibold text-slate-500">Progress</div>
            <div className="text-3xl font-bold text-slate-900 leading-none">{progress}%</div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#cd3731] transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex gap-2 mt-2 justify-end flex-wrap">
            <button 
              onClick={() => handleBatchUpdate('installed')}
              disabled={isUpdating}
              className={`px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors flex items-center gap-1 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <CheckCircle2 className="w-3 h-3" />
              {isUpdating ? '...' : t('installAll')}
            </button>
            <button 
              onClick={() => handleBatchUpdate('delivered')}
              disabled={isUpdating}
              className={`px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors flex items-center gap-1 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Package className="w-3 h-3" />
              {isUpdating ? '...' : t('deliverAll')}
            </button>
            <button 
              onClick={() => handleBatchUpdate('pending')}
              disabled={isUpdating}
              className={`px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <XCircle className="w-3 h-3" />
              {isUpdating ? '...' : t('resetAll')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog View */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-10">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Left: Floor Plan */}
          <div className="w-full lg:w-2/5 xl:w-1/3 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900">Floor Plan</h3>
              <button
                onClick={() => {
                  if (isEditMode) {
                    handleSaveAreas();
                  } else {
                    setIsEditMode(true);
                  }
                }}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isEditMode ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isEditMode ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Layout</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Adjust Layout</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative w-full bg-slate-50 rounded-2xl p-4 border border-slate-100" style={{ paddingBottom: ['1A', '1Am', '1A-1m'].includes(room.type) ? '140%' : '100%' }}>
              <img 
                src={floorPlanUrl} 
                alt={`Floor plan for type ${room.type}`} 
                className="absolute inset-0 w-full h-full object-contain p-2"
                referrerPolicy="no-referrer"
              />
              
              {/* Clickable Overlays on Floor Plan */}
              {clickableAreas.map((area, index) => {
                const item = room.furniture.find(f => f.code.includes(area.code) || area.code.includes(f.code) || f.name.toLowerCase().includes(area.name.toLowerCase()));
                if (!item) return null;

                const isEditingThis = isEditMode && editingAreaIndex === index;

                return (
                  <div
                    key={index}
                    className={`absolute cursor-pointer transition-all duration-200 rounded-md flex items-center justify-center
                      ${isEditMode ? 'border-2 border-dashed hover:bg-indigo-500/20' : 'hover:bg-indigo-500/20'}
                      ${isEditingThis ? 'border-indigo-500 bg-indigo-500/30 z-10' : (isEditMode ? 'border-slate-400 bg-slate-400/10' : '')}
                      ${!isEditMode && selectedFurnitureId === item.id ? 'bg-indigo-500/30 ring-2 ring-indigo-500' : ''}
                    `}
                    style={{ top: area.top, left: area.left, width: area.width, height: area.height }}
                    onClick={() => {
                      if (isEditMode) {
                        setEditingAreaIndex(index);
                      } else {
                        openUpdateModal(item.id);
                      }
                    }}
                    title={`${item.name} (${getBaseCode(item.code)})`}
                  >
                    {!isEditMode && item.status === 'installed' && (
                      <div className="bg-white rounded-full p-1 shadow-md transform scale-125">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                    )}
                    {!isEditMode && item.status === 'installing' && (
                      <div className="bg-white rounded-full p-1 shadow-md transform scale-125 relative">
                        <Hammer className="w-6 h-6 text-amber-500" />
                        {item.installProgress > 0 && (
                          <span className="absolute -top-2 -right-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
                            {item.installProgress}%
                          </span>
                        )}
                      </div>
                    )}
                    {!isEditMode && item.status === 'delivered' && (
                      <div className="bg-white rounded-full p-1 shadow-md transform scale-125">
                        <Package className="w-6 h-6 text-blue-500" />
                      </div>
                    )}
                    {isEditMode && (
                      <span className="text-[10px] font-bold bg-white/80 px-1 rounded text-slate-800 pointer-events-none">
                        {getBaseCode(area.code)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {isEditMode && editingAreaIndex !== null && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-sm text-indigo-900">Adjusting: {clickableAreas[editingAreaIndex].name}</h4>
                  <button onClick={() => setEditingAreaIndex(null)} className="text-indigo-400 hover:text-indigo-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-indigo-700">Top (%)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={parseFloat(clickableAreas[editingAreaIndex].top)} 
                      onChange={(e) => handleAreaChange(editingAreaIndex, 'top', e.target.value)} 
                      className="w-full p-1.5 text-sm border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-indigo-700">Left (%)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={parseFloat(clickableAreas[editingAreaIndex].left)} 
                      onChange={(e) => handleAreaChange(editingAreaIndex, 'left', e.target.value)} 
                      className="w-full p-1.5 text-sm border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-indigo-700">Width (%)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={parseFloat(clickableAreas[editingAreaIndex].width)} 
                      onChange={(e) => handleAreaChange(editingAreaIndex, 'width', e.target.value)} 
                      className="w-full p-1.5 text-sm border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-indigo-700">Height (%)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={parseFloat(clickableAreas[editingAreaIndex].height)} 
                      onChange={(e) => handleAreaChange(editingAreaIndex, 'height', e.target.value)} 
                      className="w-full p-1.5 text-sm border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                </div>
              </div>
            )}

            {!isEditMode && (
              <p className="text-center text-sm text-slate-500 mt-4 flex items-center justify-center">
                <Info className="w-4 h-4 mr-1" />
                {t('clickToUpdate')}
              </p>
            )}
          </div>

          {/* Right: Furniture Grid */}
          <div className="w-full lg:w-3/5 xl:w-2/3">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10">
              {room.furniture.map(item => (
                <div
                  key={item.id}
                  onClick={() => openUpdateModal(item.id)}
                  className="group cursor-pointer flex flex-col items-center"
                >
                  <div className="relative w-full aspect-square mb-3 bg-slate-50 p-4 flex items-center justify-center transition-all duration-300 border border-slate-200 rounded-xl group-hover:border-[#cd3731] group-hover:shadow-md overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-[75%] h-[75%] object-contain transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Status Badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      {item.status === 'installed' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-full p-1.5 animate-in zoom-in">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      )}
                      {item.status === 'installing' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-full p-1.5 animate-in zoom-in relative">
                        <Hammer className="w-5 h-5 text-amber-500" />
                          <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-600 shadow-sm">
                            {item.installProgress}%
                          </span>
                        </div>
                      )}
                      {item.status === 'delivered' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-full p-1.5 animate-in zoom-in">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      {item.status === 'pending' && (
                        <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Clock className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center w-full">
                    <p className="font-bold text-slate-900 text-sm md:text-base group-hover:text-[#cd3731] transition-colors">{getBaseCode(item.code)}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Update Modal */}
      {selectedFurniture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedFurnitureId(null)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-semibold text-slate-900">{t('updateStatus')}</h3>
              <button 
                onClick={handleCancelUpdate}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[70vh]">
              {/* Selected Item Info */}
              <div className="flex items-center space-x-5">
                <div className="w-24 h-24 bg-slate-50 rounded-2xl border border-slate-100 p-2 flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={selectedFurniture.imageUrl} 
                    alt={selectedFurniture.name} 
                    className="w-[80%] h-[80%] object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{getBaseCode(selectedFurniture.code)}</h4>
                  <p className="text-sm text-slate-500 uppercase tracking-wider mt-1">{selectedFurniture.name}</p>
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 uppercase tracking-wider">{t('status')}</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleStatusChange('delivered')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      tempStatus === 'delivered'
                        ? 'border-blue-400 bg-blue-50 text-blue-900 shadow-sm'
                        : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <Package className={`w-6 h-6 ${tempStatus === 'delivered' ? 'text-blue-600' : ''}`} />
                    <span className="text-xs font-medium">{t('delivered')}</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange('installing')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      tempStatus === 'installing'
                        ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-sm'
                        : 'border-slate-100 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <Hammer className={`w-6 h-6 ${tempStatus === 'installing' ? 'text-amber-600' : ''}`} />
                    <span className="text-xs font-medium">{t('installing')}</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange('installed')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      tempStatus === 'installed'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900 shadow-sm'
                        : 'border-slate-100 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className={`w-6 h-6 ${tempStatus === 'installed' ? 'text-emerald-600' : ''}`} />
                    <span className="text-xs font-medium">{t('installed')}</span>
                  </button>
                </div>
                
                {/* Reset Button */}
                <button
                  onClick={() => handleStatusChange('pending')}
                  className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg border transition-all mt-2 ${
                    tempStatus === 'pending'
                      ? 'border-slate-300 bg-slate-100 text-slate-600'
                      : 'border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">{t('resetStatus')}</span>
                </button>
              </div>

              {/* Progress Slider */}
              {(tempStatus === 'installing' || tempStatus === 'installed') && (
                <div className="space-y-4 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-2 fade-in">
                  <div className="flex justify-between items-center">
                    <label htmlFor={`progress-${selectedFurniture.id}`} className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                      {t('installProgress')}
                    </label>
                    <span className="text-lg font-bold text-[#cd3731]">{tempProgress}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      id={`progress-slider-${selectedFurniture.id}`}
                      min="0"
                      max="100"
                      step="5"
                      value={tempProgress || 0}
                      onChange={handleProgressChange}
                      className="w-full h-2.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#cd3731]"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
              
              {/* Notes and Images */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div>
                  <label className="text-sm font-semibold text-slate-900 uppercase tracking-wider block mb-2">
                    Notes
                  </label>
                  <textarea
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    placeholder="Add any remarks or notes here..."
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#cd3731] focus:border-transparent outline-none resize-none h-24 text-sm"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                      Images ({tempImages.length}/4)
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {tempImages.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={img} alt={`Attached ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setTempImages(tempImages.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {tempImages.length < 4 && (
                      <label className="cursor-pointer aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-[#cd3731] hover:text-[#cd3731] transition-colors bg-slate-50 hover:bg-red-50/30">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setTempImages([...tempImages, reader.result as string]);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <span className="text-2xl font-light leading-none">+</span>
                        <span className="text-[10px] font-medium mt-1">Add Photo</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Apply to similar items checkbox */}
              {similarItemsCount > 1 && (
                <div className="pt-4 pb-2 animate-in fade-in">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 hover:bg-indigo-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={applyToAllSimilar}
                      onChange={(e) => setApplyToAllSimilar(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-indigo-900">
                      {t('applyToAllSimilar', { code: getBaseCode(selectedFurniture.code), count: similarItemsCount })}
                    </span>
                  </label>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md flex gap-3 sticky bottom-0 z-10">
              <button
                onClick={handleCancelUpdate}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmUpdate}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
