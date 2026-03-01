export type ItemStatus = 'pending' | 'delivered' | 'installing' | 'installed';

export interface FurnitureItem {
  id: string;
  code: string;
  name: string;
  status: ItemStatus;
  installProgress: number;
  imageUrl: string;
  notes?: string;
  images?: string[];
}

export interface Room {
  id: string;
  unitNo: string;
  floor: number;
  type: string;
  furniture: FurnitureItem[];
}

const defaultFurnitureList = [
  { code: 'F-04', name: 'TV Console', imageUrl: 'https://images.unsplash.com/photo-1595514535415-ebc0ea7f2408?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { code: 'F-09R', name: 'Shoe Cabinet', imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { code: 'F-01', name: 'SOFA', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { code: 'F-05', name: 'DINING TABLE', imageUrl: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { code: 'F-06-1', name: 'DINING CHAIR 1', imageUrl: 'https://images.unsplash.com/photo-1503602642458-232111445657?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { code: 'F-06-2', name: 'DINING CHAIR 2', imageUrl: 'https://images.unsplash.com/photo-1503602642458-232111445657?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { code: 'F-10', name: "BED 5'", imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
  { code: 'F-14R', name: 'Wardrobe', imageUrl: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
];

const type1AFurnitureList = [
  { code: 'F-04', name: 'TV Console', imageUrl: 'https://i.postimg.cc/NFh8Hw3B/F04TVCONSOLE.png' },
  { code: 'F-09L', name: 'Shoe Cabinet', imageUrl: 'https://i.postimg.cc/1RH46ShB/F09LSHOECABINET.png' },
  { code: 'F-01', name: 'SOFA', imageUrl: 'https://i.postimg.cc/28DMppVv/F01SOFA.png' },
  { code: 'F-05', name: 'DINING TABLE', imageUrl: 'https://i.postimg.cc/02PDRZxZ/F05dinningtable.png' },
  { code: 'F-06-1', name: 'DINING CHAIR 1', imageUrl: 'https://i.postimg.cc/J4pDwLpM/F06DINNINGCHAIR.png' },
  { code: 'F-06-2', name: 'DINING CHAIR 2', imageUrl: 'https://i.postimg.cc/J4pDwLpM/F06DINNINGCHAIR.png' },
  { code: 'F-10', name: "BED 5'", imageUrl: 'https://i.postimg.cc/gcTF1t3y/F10Bed5.png' },
  { code: 'F-14L', name: 'Wardrobe', imageUrl: 'https://i.postimg.cc/MTLP34gP/F14l-Wardrobe.png' },
];

const type1AmFurnitureList = [
  { code: 'F-04', name: 'TV Console', imageUrl: 'https://i.postimg.cc/NFh8Hw3B/F04TVCONSOLE.png' },
  { code: 'F-09R', name: 'Shoe Cabinet', imageUrl: 'https://i.postimg.cc/yY0XNBHx/F09L.png' },
  { code: 'F-01', name: 'SOFA', imageUrl: 'https://i.postimg.cc/28DMppVv/F01SOFA.png' },
  { code: 'F-05', name: 'DINING TABLE', imageUrl: 'https://i.postimg.cc/02PDRZxZ/F05dinningtable.png' },
  { code: 'F-06-1', name: 'DINING CHAIR 1', imageUrl: 'https://i.postimg.cc/J4pDwLpM/F06DINNINGCHAIR.png' },
  { code: 'F-06-2', name: 'DINING CHAIR 2', imageUrl: 'https://i.postimg.cc/J4pDwLpM/F06DINNINGCHAIR.png' },
  { code: 'F-10', name: "BED 5'", imageUrl: 'https://i.postimg.cc/gcTF1t3y/F10Bed5.png' },
  { code: 'F-14R', name: 'Wardrobe', imageUrl: 'https://i.postimg.cc/sXB5CCmG/F14L.png' },
];

const type1BFurnitureList = [
  { code: 'F-04.1', name: 'TV Console', imageUrl: 'https://i.postimg.cc/QdTpz36t/F-04-1.png' },
  { code: 'F-09L', name: 'Shoe Cabinet', imageUrl: 'https://i.postimg.cc/yY0XNBHx/F09L.png' },
  { code: 'F-01', name: 'SOFA', imageUrl: 'https://i.postimg.cc/28DMppVv/F01SOFA.png' },
  { code: 'F-05', name: 'DINING TABLE', imageUrl: 'https://i.postimg.cc/8PC4txQc/F051b.png' },
  { code: 'F-06-1', name: 'DINING CHAIR 1', imageUrl: 'https://i.postimg.cc/J4pDwLpM/F06DINNINGCHAIR.png' },
  { code: 'F-06-2', name: 'DINING CHAIR 2', imageUrl: 'https://i.postimg.cc/J4pDwLpM/F06DINNINGCHAIR.png' },
  { code: 'F-06-3', name: 'DINING CHAIR 3', imageUrl: 'https://i.postimg.cc/J4pDwLpM/F06DINNINGCHAIR.png' },
  { code: 'F-06-4', name: 'DINING CHAIR 4', imageUrl: 'https://i.postimg.cc/J4pDwLpM/F06DINNINGCHAIR.png' },
  { code: 'F-10.1', name: "BED 3.5'", imageUrl: 'https://i.postimg.cc/vZNNrb4B/F10-1.png' },
  { code: 'F-10', name: "BED 5'", imageUrl: 'https://i.postimg.cc/gcTF1t3y/F10Bed5.png' },
  { code: 'F-14R', name: 'Wardrobe', imageUrl: 'https://i.postimg.cc/85SQvNYC/F14R.png' },
  { code: 'F-14.1L', name: 'Wardrobe', imageUrl: 'https://i.postimg.cc/PqNkHSw-N/F14-1L.png' },
];

export const getFurnitureListForType = (type: string) => {
  if (type === '1A' || type === '1A-1m') {
    return type1AFurnitureList;
  }
  if (type === '1Am') {
    return type1AmFurnitureList;
  }
  if (type === '1B') {
    return type1BFurnitureList;
  }
  return defaultFurnitureList;
};

export const getFloorPlanImage = (type: string) => {
  switch (type) {
    case '1Am':
      return 'https://i.postimg.cc/52JgBDtf/1AM.png';
    case '1A-1m':
      return 'https://i.ibb.co/svkB6zdL/plan.png';
    case '1B':
      return 'https://i.postimg.cc/NfkmcFgc/1B.png';
    case '1A':
      return 'https://i.ibb.co/svkB6zdL/plan.png';
    default:
      return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  }
};

const generateFurniture = (type: string): FurnitureItem[] => {
  const list = getFurnitureListForType(type);
  return list.map((item, index) => ({
    id: `f-${index}`,
    code: item.code,
    name: item.name,
    status: 'pending',
    installProgress: 0,
    imageUrl: item.imageUrl,
  }));
};

export const generateInitialData = (): Room[] => {
  const rooms: Room[] = [];

  // Floor 2
  const floor2Types = [
    '1A', '1Am', '1A', '1Am', '1A', '1Am', '1B', '1Am', '1A', '1Am',
    '1A', '1Am', '1A', '1Am', '1A', '1A-1m', '1A', '1Am'
  ];
  
  for (let i = 0; i < 18; i++) {
    const unitNo = `2${String(i + 1).padStart(2, '0')}`;
    const type = floor2Types[i];
    rooms.push({
      id: unitNo,
      unitNo,
      floor: 2,
      type,
      furniture: generateFurniture(type),
    });
  }

  // Floors 3-8
  const floor3to8Types = [
    '1A', '1Am', '1A', '1Am', '1A', '1Am', '1B', '1Am', '1A', '1Am',
    '1A', '1Am', '1A', '1Am', '1A', '1A', '1Am', '1A', '1A-1m', '1A', '1Am'
  ];

  for (let floor = 3; floor <= 8; floor++) {
    for (let i = 0; i < 21; i++) {
      const unitNo = `${floor}${String(i + 1).padStart(2, '0')}`;
      const type = floor3to8Types[i];
      rooms.push({
        id: unitNo,
        unitNo,
        floor,
        type,
        furniture: generateFurniture(type),
      });
    }
  }

  return rooms;
};
