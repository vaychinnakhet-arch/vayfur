import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppContext } from '../store';
import { ChevronRight, CheckCircle2, Hammer, Clock, ArrowLeft, LayoutGrid, List } from 'lucide-react';

export const FloorList: React.FC = () => {
  const { rooms, t } = useAppContext();
  const floors = [2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{t('floors')}</h1>
          <p className="text-slate-500 font-medium">Select a floor to manage room installations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {floors.map((floor) => {
          const floorRooms = rooms.filter((r) => r.floor === floor);
          let totalItems = 0;
          let installedItems = 0;
          floorRooms.forEach((room) => {
            room.furniture.forEach((item) => {
              totalItems++;
              if (item.status === 'installed') installedItems++;
            });
          });
          const progress = totalItems === 0 ? 0 : Math.round((installedItems / totalItems) * 100);
          const isComplete = progress === 100;

          return (
            <Link 
              key={floor} 
              to={`/floors/${floor}`}
              className={`group relative bg-white rounded-xl shadow-sm border transition-all duration-200 flex flex-col overflow-hidden
                ${isComplete 
                  ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-md' 
                  : 'border-slate-200 hover:border-[#cd3731] hover:shadow-md'
                }
              `}
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-base font-semibold text-slate-500 mb-1 block">{t('floor')}</span>
                    <span className="text-6xl font-bold text-slate-900 leading-none tracking-tight">{floor}</span>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
                    ${isComplete 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-slate-100 text-slate-400 group-hover:bg-[#cd3731] group-hover:text-white'
                    }
                  `}>
                    {isComplete ? <CheckCircle2 className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between text-base mb-3 font-semibold items-end">
                    <span className="text-slate-600">{floorRooms.length} {t('rooms')}</span>
                    <span className={`text-lg ${isComplete ? 'text-emerald-600' : 'text-[#cd3731]'}`}>
                      {progress}%
                    </span>
                  </div>
                  
                  {/* Flat progress bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-[#cd3731]'}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-sm font-medium text-slate-400">
                    {installedItems} / {totalItems} items
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const FloorDetail: React.FC = () => {
  const { floorId } = useParams<{ floorId: string }>();
  const { rooms, t } = useAppContext();
  
  const floor = parseInt(floorId || '0', 10);
  const floorRooms = rooms.filter((r) => r.floor === floor);

  if (!floorRooms.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Floor not found</h2>
        <Link to="/floors" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Floors
        </Link>
      </div>
    );
  }

  // Calculate floor stats
  let floorTotal = 0;
  let floorInstalled = 0;
  floorRooms.forEach(r => {
    r.furniture.forEach(i => {
      floorTotal++;
      if (i.status === 'installed') floorInstalled++;
    });
  });
  const floorProgress = floorTotal === 0 ? 0 : Math.round((floorInstalled / floorTotal) * 100);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-5">
          <Link to="/floors" className="p-2.5 rounded-full border border-slate-200 hover:border-[#cd3731] hover:bg-[#cd3731] hover:text-white transition-colors text-slate-500 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-sm font-semibold text-slate-500 mb-1 block">Managing</span>
            <h1 className="text-4xl font-bold text-slate-900 mb-1">{t('floor')} {floor}</h1>
            <p className="text-slate-500 font-medium">{floorRooms.length} rooms to manage</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 min-w-[200px]">
          <div className="w-full flex justify-between items-end">
            <div className="text-sm font-semibold text-slate-500">Progress</div>
            <div className="text-3xl font-bold text-slate-900 leading-none">{floorProgress}%</div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#cd3731] transition-all duration-500"
              style={{ width: `${floorProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
        {floorRooms.map((room) => {
          let total = 0;
          let installed = 0;
          let delivered = 0;
          let installing = 0;
          room.furniture.forEach((item) => {
            total++;
            if (item.status === 'installed') installed++;
            if (item.status === 'delivered') delivered++;
            if (item.status === 'installing') installing++;
          });
          const progress = total === 0 ? 0 : Math.round((installed / total) * 100);
          const isComplete = progress === 100;
          const isStarted = progress > 0;

          return (
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className={`group relative flex flex-col bg-white rounded-xl shadow-sm border transition-all duration-200 overflow-hidden
                ${isComplete 
                  ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-md' 
                  : isStarted 
                    ? 'border-slate-300 hover:border-[#cd3731] hover:shadow-md' 
                    : 'border-slate-200 hover:border-[#cd3731] hover:shadow-md'
                }
              `}
            >
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-md border
                    ${isComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}
                  `}>
                    {room.type}
                  </span>
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : installing > 0 ? (
                    <Hammer className="w-5 h-5 text-amber-500 animate-pulse" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>
                  )}
                </div>
                
                <h3 className="text-3xl font-bold text-slate-900 mb-4 group-hover:text-[#cd3731] transition-colors">
                  {room.unitNo}
                </h3>
                
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-sm font-medium text-slate-500">
                      {installed} / {total}
                    </div>
                    <div className={`text-base font-bold ${isComplete ? 'text-emerald-600' : 'text-[#cd3731]'}`}>
                      {progress}%
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full transition-all duration-500 
                        ${isComplete ? 'bg-emerald-500' : installing > 0 ? 'bg-amber-500' : 'bg-[#cd3731]'}
                      `}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Hover Action Strip */}
              <div className={`p-3 text-center text-xs font-bold uppercase tracking-wider border-t transition-colors
                ${isComplete 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-[#cd3731] group-hover:text-white group-hover:border-[#cd3731]'
                }
              `}>
                {isComplete ? 'View Details' : 'Update Status'}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
