import React, { useState, useRef } from 'react';
import { useAppContext } from '../store';
import { Download, CheckSquare, Search, CheckCircle, CheckCircle2, Hammer, Printer, ChevronLeft, Check, Image as ImageIcon, LayoutList, Building, Package } from 'lucide-react';
import { toPng } from 'html-to-image';

type ReportType = 'room' | 'floor';

export const Reports: React.FC = () => {
  const { rooms, t } = useAppContext();
  const [reportType, setReportType] = useState<ReportType>('room');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showSignatures, setShowSignatures] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Get unique floors
  const uniqueFloors = Array.from(new Set<number>(rooms.map(r => r.floor))).sort((a, b) => a - b);

  // Filtered rooms for the list (based on floor and search)
  const filteredRooms = rooms.filter(room => {
    const matchesFloor = selectedFloor === null || room.floor === selectedFloor;
    const matchesSearch = room.unitNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFloor && matchesSearch;
  });

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const floorRooms = rooms.filter(r => r.floor === selectedFloor);
  
  // For Floor Report: Get all unique item codes for the selected floor
  const allItemCodes = Array.from(new Set<string>(floorRooms.flatMap(r => r.furniture.map(f => f.code)))).sort();

  const handleExportPNG = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    
    try {
      const element = reportRef.current;
      
      // Wait a tick for DOM to update and remove overflow classes
      await new Promise(resolve => setTimeout(resolve, 150));

      const dataUrl = await toPng(element, {
        quality: 1,
        backgroundColor: '#ffffff',
        pixelRatio: 2, // Higher resolution
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${element.scrollWidth}px`,
          height: `${element.scrollHeight}px`,
          margin: '0'
        }
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      const fileName = reportType === 'room' && selectedRoom 
        ? `Room_Checklist_${selectedRoom.unitNo}.png` 
        : `Floor_Report_Fl_${selectedFloor}.png`;
      link.download = fileName;
      link.click();
    } catch (error) {
      console.error('Error generating PNG:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{t('reports')}</h1>
          <p className="text-slate-500 font-medium">Generate and export installation reports</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setReportType('room')}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              reportType === 'room' ? 'bg-white text-[#cd3731] shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Room Checklist
          </button>
          <button
            onClick={() => setReportType('floor')}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              reportType === 'floor' ? 'bg-white text-[#cd3731] shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4 mr-2" />
            Floor Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Selection */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[calc(100vh-16rem)] min-h-[500px] overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              {reportType === 'floor' ? t('selectFloor') : (selectedFloor === null ? t('selectFloor') : t('selectRoom'))}
            </h3>
            {reportType === 'room' && selectedFloor !== null && (
              <button 
                onClick={() => {
                  setSelectedFloor(null);
                  setSelectedRoomId(null);
                }}
                className="flex items-center text-sm font-semibold text-[#cd3731] hover:text-[#a82d28] mb-4 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> {t('backToFloors')}
              </button>
            )}
            {reportType === 'room' && selectedFloor !== null && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('searchRoom')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:border-[#cd3731] focus:ring-1 focus:ring-[#cd3731] text-sm transition-colors"
                />
              </div>
            )}
          </div>
          <div className="overflow-y-auto flex-1 p-5 custom-scrollbar">
            {reportType === 'floor' || selectedFloor === null ? (
              // Floor Selection
              <div className="grid grid-cols-2 gap-3">
                {uniqueFloors.map(floor => (
                  <button
                    key={floor}
                    onClick={() => {
                      setSelectedFloor(floor);
                      setSelectedRoomId(null);
                    }}
                    className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all duration-200 ${
                      selectedFloor === floor && reportType === 'floor'
                        ? 'border-[#cd3731] bg-[#cd3731]/5 text-[#cd3731]' 
                        : 'border-slate-100 hover:border-[#cd3731]/30 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-4xl font-light tracking-tighter">{floor}</span>
                    <span className="text-sm font-medium mt-1 text-slate-500">{t('floor')}</span>
                  </button>
                ))}
              </div>
            ) : reportType === 'room' ? (
              // Room Selection Grid
              <>
                <div className="grid grid-cols-3 gap-3">
                  {filteredRooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedRoomId === room.id 
                          ? 'border-[#cd3731] bg-[#cd3731] text-white shadow-md' 
                          : 'border-slate-100 hover:border-[#cd3731]/30 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className={`text-lg font-bold tracking-tight ${selectedRoomId === room.id ? 'text-white' : 'text-slate-900'}`}>{room.unitNo}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mt-1 rounded-md border ${selectedRoomId === room.id ? 'border-white/20 text-white/90 bg-white/10' : 'border-slate-200 text-slate-500 bg-white'}`}>{room.type}</span>
                    </button>
                  ))}
                </div>
                {filteredRooms.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    {t('roomNotFound')}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center">
                <Building className="w-12 h-12 text-slate-200 mb-3" />
                <p className="font-medium">Floor {selectedFloor} selected.</p>
                <p className="mt-1 text-xs">View the report on the right.</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Report View */}
        <div className="lg:col-span-3">
          {reportType === 'room' ? (
            selectedRoom ? (
              <div className={`bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col ${isExporting ? '' : 'overflow-hidden'}`}>
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center">
                    <CheckSquare className="w-5 h-5 mr-3 text-[#cd3731]" />
                    {t('checklistReport')} - {t('room')} <span className="font-bold ml-1">{selectedRoom.unitNo}</span>
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={showSignatures}
                          onChange={() => setShowSignatures(!showSignatures)}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${showSignatures ? 'bg-[#cd3731]' : 'bg-slate-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showSignatures ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="ml-2 text-sm font-medium text-slate-700">Signatures</span>
                    </label>
                    <button 
                      onClick={handleExportPNG}
                      disabled={isExporting}
                      className={`flex items-center text-sm text-white font-bold px-4 py-2 rounded-md transition-colors shadow-sm ${isExporting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#cd3731] hover:bg-[#a82d28]'}`}
                    >
                      <Printer className="w-4 h-4 mr-2" /> {isExporting ? 'Exporting...' : 'Export PNG (A4)'}
                    </button>
                  </div>
                </div>
                
                <div className={`p-6 bg-slate-100/50 ${isExporting ? '' : 'overflow-x-auto'}`}>
                  {/* A4 Container for Export */}
                  <div 
                    ref={reportRef} 
                    className="bg-white mx-auto shadow-md"
                    style={{ 
                      width: '210mm', 
                      minHeight: '297mm', 
                      padding: '20mm',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Report Header */}
                    <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 uppercase tracking-wider">Room Inspection Report</h1>
                        <p className="text-slate-600 font-medium">Vay Chinnakhet Furniture Checklist</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1">Date: {new Date().toLocaleDateString()}</div>
                        <div className="text-2xl font-bold text-[#cd3731]">Unit: {selectedRoom.unitNo}</div>
                        <div className="text-sm font-medium text-slate-600">Type: {selectedRoom.type} | Floor: {selectedRoom.floor}</div>
                      </div>
                    </div>

                    {/* Formal Report Summary */}
                    <div className="mb-8">
                      {(() => {
                        let rTotal = 0, rInstalled = 0, rDelivered = 0, rInstalling = 0, rPending = 0;
                        selectedRoom.furniture.forEach(item => {
                          rTotal++;
                          if (item.status === 'installed') rInstalled++;
                          else if (item.status === 'installing') rInstalling++;
                          else if (item.status === 'delivered') rDelivered++;
                          else rPending++;
                        });
                        const progress = rTotal === 0 ? 0 : Math.round((rInstalled / rTotal) * 100);
                        
                        return (
                          <table className="w-full border-collapse border border-slate-800 text-sm">
                            <tbody>
                              <tr>
                                <td className="border border-slate-800 px-4 py-2 bg-slate-100 font-bold w-1/4">Total Items</td>
                                <td className="border border-slate-800 px-4 py-2 text-center w-1/4 font-medium">{rTotal}</td>
                                <td className="border border-slate-800 px-4 py-2 bg-slate-100 font-bold w-1/4">Installed</td>
                                <td className="border border-slate-800 px-4 py-2 text-center w-1/4 font-medium">{rInstalled}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-800 px-4 py-2 bg-slate-100 font-bold">Installing</td>
                                <td className="border border-slate-800 px-4 py-2 text-center font-medium">{rInstalling}</td>
                                <td className="border border-slate-800 px-4 py-2 bg-slate-100 font-bold">Delivered</td>
                                <td className="border border-slate-800 px-4 py-2 text-center font-medium">{rDelivered}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-800 px-4 py-2 bg-slate-100 font-bold">Pending</td>
                                <td className="border border-slate-800 px-4 py-2 text-center font-medium">{rPending}</td>
                                <td className="border border-slate-800 px-4 py-2 bg-slate-100 font-bold">Overall Progress</td>
                                <td className="border border-slate-800 px-4 py-2 text-center font-bold text-[#cd3731]">{progress}%</td>
                              </tr>
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>

                  {/* Checklist Table */}
                  <table className="w-full border-collapse border border-slate-300 text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-2 py-3 text-center font-bold text-slate-800 w-12">No.</th>
                        <th className="border border-slate-300 px-2 py-3 text-center font-bold text-slate-800 w-24">Image</th>
                        <th className="border border-slate-300 px-4 py-3 text-left font-bold text-slate-800">Item Name</th>
                        <th className="border border-slate-300 px-4 py-3 text-left font-bold text-slate-800 w-24">Code</th>
                        <th className="border border-slate-300 px-2 py-3 text-center font-bold text-slate-800 w-20">Delivered</th>
                        <th className="border border-slate-300 px-2 py-3 text-center font-bold text-slate-800 w-20">Installed</th>
                        <th className="border border-slate-300 px-4 py-3 text-left font-bold text-slate-800 min-w-[150px]">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRoom.furniture.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="border border-slate-300 px-2 py-3 text-center text-slate-500">{index + 1}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded mx-auto border border-slate-200" crossOrigin="anonymous" />
                            ) : (
                              <div className="w-16 h-16 bg-slate-100 rounded mx-auto flex items-center justify-center border border-slate-200">
                                <ImageIcon className="w-6 h-6 text-slate-300" />
                              </div>
                            )}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 font-medium text-slate-900">{item.name}</td>
                          <td className="border border-slate-300 px-4 py-3 font-mono text-slate-600 text-xs">
                            {item.code.startsWith('F-06') ? 'F-06' : item.code}
                          </td>
                          <td className="border border-slate-300 px-2 py-3 text-center">
                            {(item.status === 'delivered' || item.status === 'installing' || item.status === 'installed') && (
                              <Check className="w-5 h-5 text-slate-800 mx-auto" />
                            )}
                          </td>
                          <td className="border border-slate-300 px-2 py-3 text-center">
                            {item.status === 'installed' && (
                              <Check className="w-5 h-5 text-slate-800 mx-auto" />
                            )}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-left align-top">
                            {item.notes && (
                              <p className="text-xs text-slate-700 mb-2 whitespace-pre-wrap">{item.notes}</p>
                            )}
                            {item.images && item.images.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.images.map((img, i) => (
                                  <img key={i} src={img} alt={`Note ${i+1}`} className="w-10 h-10 object-cover rounded border border-slate-200" crossOrigin="anonymous" />
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Signatures */}
                  {showSignatures && (
                    <div className="mt-16 grid grid-cols-2 gap-12">
                      <div className="text-center">
                        <div className="border-b border-slate-400 h-10 mb-2"></div>
                        <div className="text-sm font-bold text-slate-800">Inspector Signature</div>
                        <div className="text-xs text-slate-500 mt-1">Date: ____/____/______</div>
                      </div>
                      <div className="text-center">
                        <div className="border-b border-slate-400 h-10 mb-2"></div>
                        <div className="text-sm font-bold text-slate-800">Contractor Signature</div>
                        <div className="text-xs text-slate-500 mt-1">Date: ____/____/______</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-slate-500">
              <CheckSquare className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-lg font-medium">{t('selectRoom')}</p>
              <p className="text-sm mt-1">Please select a room from the list to view its checklist report.</p>
            </div>
          )
        ) : (
          // Floor Report View
          selectedFloor ? (
            <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${isExporting ? '' : 'overflow-hidden'}`}>
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-[#cd3731]" />
                  Floor {selectedFloor} Report
                </h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleExportPNG}
                    disabled={isExporting}
                    className={`flex items-center text-sm text-white font-bold px-4 py-2 rounded-md transition-colors shadow-sm ${isExporting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#cd3731] hover:bg-[#a82d28]'}`}
                  >
                    <Printer className="w-4 h-4 mr-2" /> {isExporting ? 'Exporting...' : 'Export PNG (A4)'}
                  </button>
                </div>
              </div>
              
              <div className={`p-6 bg-slate-100/50 ${isExporting ? '' : 'overflow-x-auto'}`}>
                {/* A4 Container for Export */}
                <div 
                  ref={reportRef} 
                  className="bg-white mx-auto shadow-md"
                  style={{ 
                    width: '297mm', // Landscape A4
                    minHeight: '210mm', 
                    padding: '15mm',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Report Header */}
                  <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 mb-1 uppercase tracking-wider">Floor Inspection Report</h1>
                      <p className="text-sm text-slate-600 font-medium">Vay Chinnakhet Furniture Checklist</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">Date: {new Date().toLocaleDateString()}</div>
                      <div className="text-xl font-bold text-[#cd3731]">Floor: {selectedFloor}</div>
                    </div>
                  </div>

                  {/* Floor Report Table */}
                  <table className="w-full border-collapse border border-slate-800 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-800 p-2 text-center font-bold text-slate-800 w-16">Room</th>
                        <th className="border border-slate-800 p-2 text-center font-bold text-slate-800 w-12">Type</th>
                        {allItemCodes.map(code => {
                          // Find the name for this code from any room that has it
                          const itemWithName = floorRooms.flatMap(r => r.furniture).find(f => f.code === code);
                          const name = itemWithName ? itemWithName.name : '';
                          
                          return (
                            <th key={code} className="border border-slate-800 p-2 text-center font-bold text-slate-800 max-w-[60px]" title={`${code} - ${name}`}>
                              <div className="flex flex-col items-center">
                                <span className="text-[10px]">{code.startsWith('F-06') ? 'F-06' : code}</span>
                                <span className="text-[8px] font-normal text-slate-600 truncate w-full overflow-hidden whitespace-nowrap">{name}</span>
                              </div>
                            </th>
                          );
                        })}
                        <th className="border border-slate-800 p-2 text-center font-bold text-slate-800 w-16">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floorRooms.map((room, index) => {
                        let rTotal = 0, rInstalled = 0;
                        room.furniture.forEach(item => {
                          rTotal++;
                          if (item.status === 'installed') rInstalled++;
                        });
                        const progress = rTotal === 0 ? 0 : Math.round((rInstalled / rTotal) * 100);

                        return (
                          <tr key={room.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border border-slate-800 p-2 text-center font-bold text-slate-900">{room.unitNo}</td>
                            <td className="border border-slate-800 p-2 text-center text-slate-600">{room.type}</td>
                            {allItemCodes.map(code => {
                              const item = room.furniture.find(f => f.code === code);
                              return (
                                <td key={code} className={`border border-slate-800 p-2 text-center ${!item ? 'bg-slate-300' : ''}`}>
                                  {item ? (
                                    item.status === 'installed' ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                    ) : item.status === 'installing' ? (
                                      <div className="flex items-center justify-center gap-0.5" title={`${item.installProgress}%`}>
                                        <Hammer className="w-3 h-3 text-amber-500" />
                                        {item.installProgress > 0 && <span className="text-[8px] font-bold text-amber-600">{item.installProgress}%</span>}
                                      </div>
                                    ) : item.status === 'delivered' ? (
                                      <Package className="w-4 h-4 text-blue-500 mx-auto" />
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )
                                  ) : null}
                                </td>
                              );
                            })}
                            <td className="border border-slate-800 p-2 text-center font-bold text-[#cd3731]">{progress}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Legend */}
                  <div className="mt-6 flex gap-6 text-xs text-slate-600">
                    <div className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" /> = Installed</div>
                    <div className="flex items-center"><Hammer className="w-4 h-4 text-amber-500 mr-1" /> = Installing</div>
                    <div className="flex items-center"><Package className="w-4 h-4 text-blue-500 mr-1" /> = Delivered</div>
                    <div className="flex items-center"><span className="text-slate-300 mr-1">-</span> = Pending</div>
                    <div className="flex items-center"><span className="w-3 h-3 bg-slate-300 border border-slate-400 mr-1 inline-block"></span> = N/A</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-slate-500">
              <Building className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-lg font-medium">{t('selectFloor')}</p>
              <p className="text-sm mt-1">Please select a floor to view the floor report.</p>
            </div>
          )
        )}
      </div>
    </div>
  </div>
);
};
