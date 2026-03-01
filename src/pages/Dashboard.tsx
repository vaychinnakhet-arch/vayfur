import React, { useMemo } from 'react';
import { useAppContext } from '../store';
import { motion } from 'framer-motion';

interface FloorStat {
  total: number;
  installed: number;
}

interface FurnitureSummary {
  code: string;
  name: string;
  imageUrl: string;
  floors: { [key: number]: FloorStat };
  total: number;
  installed: number;
}

export const Dashboard: React.FC = () => {
  const { rooms } = useAppContext();

  const furnitureStats = useMemo(() => {
    const stats: { [code: string]: FurnitureSummary } = {};

    rooms.forEach(room => {
      room.furniture.forEach(item => {
        if (!stats[item.code]) {
          stats[item.code] = {
            code: item.code,
            name: item.name,
            imageUrl: item.imageUrl,
            floors: {},
            total: 0,
            installed: 0,
          };
        }

        const summary = stats[item.code];
        
        // Update total stats
        summary.total++;
        if (item.status === 'installed') {
          summary.installed++;
        }

        // Update floor stats
        if (!summary.floors[room.floor]) {
          summary.floors[room.floor] = { total: 0, installed: 0 };
        }
        
        summary.floors[room.floor].total++;
        if (item.status === 'installed') {
          summary.floors[room.floor].installed++;
        }
      });
    });

    return Object.values(stats).sort((a, b) => a.code.localeCompare(b.code));
  }, [rooms]);

  const floors = [2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">ภาพรวมเฟอร์นิเจอร์</h1>
          <p className="text-slate-500 font-medium">Furniture Overview & Progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {furnitureStats.map((item) => (
          <motion.div
            key={item.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row h-full transition-all duration-200 hover:border-[#cd3731] hover:shadow-md overflow-hidden"
          >
            {/* Image Section */}
            <div className="w-full md:w-1/3 bg-slate-50 relative min-h-[200px] md:min-h-0 border-b md:border-b-0 md:border-r border-slate-200">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-4">
                <div className="text-xs font-medium text-white/80 mb-1">{item.name}</div>
                <div className="text-xl font-bold text-white leading-tight">{item.code}</div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <span className="text-sm font-semibold text-slate-500">Progress by Floor</span>
                <span className="text-xs font-bold bg-[#cd3731]/10 text-[#cd3731] px-2.5 py-1 rounded-md border border-[#cd3731]/20">
                  TOTAL {item.installed} / {item.total}
                </span>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {floors.map(floor => {
                  const stat = item.floors[floor] || { total: 0, installed: 0 };
                  if (stat.total === 0) return null;

                  const progress = Math.round((stat.installed / stat.total) * 100);
                  const isComplete = progress === 100;
                  
                  return (
                    <div key={floor} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-slate-700">ชั้น {floor}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">{stat.installed} / {stat.total}</span>
                          <span className={`text-base font-bold ${isComplete ? 'text-emerald-600' : 'text-[#cd3731]'}`}>{progress}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-[#cd3731]'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
