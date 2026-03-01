# Google Apps Script Code

คุณสามารถนำโค้ดนี้ไปทับโค้ดเดิมใน Google Apps Script Editor ได้เลยครับ โค้ดนี้จะช่วยแก้ปัญหาเรื่องวันที่และเวลาโดยเฉพาะ และเพิ่มการตรวจสอบชื่อ Sheet อัตโนมัติ

```javascript
// Google Apps Script for Vay Chinnakhet Furniture Check
// Last Updated: Fix for "1Am" becoming time/date + Auto Sheet Detection

const SHEET_NAME = 'Sheet1'; // ชื่อ Sheet ที่เก็บข้อมูล (ถ้าไม่เจอจะใช้ Sheet แรกสุด)

function doGet(e) {
  const action = e.parameter ? e.parameter.action : 'getRooms'; // Default action
  
  if (action === 'getLayouts') {
    return getLayouts();
  }
  
  return getRooms();
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'updateStatus') {
      return updateFurnitureStatus(data);
    } else if (action === 'saveAll') {
      return saveAllRooms(data.rooms);
    } else if (action === 'saveLayout') {
      return saveLayout(data.roomType, data.layout);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    // Fallback to the first sheet if name doesn't match
    sheet = ss.getSheets()[0]; 
  }
  return sheet;
}

function getRooms() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1); // Skip header
  
  const rooms = rows.map((row, index) => {
    // Column mapping: 0:ID, 1:Floor, 2:UnitNo, 3:Type, 4:Furniture
    const id = String(row[0]);
    const floor = row[1];
    const unitNo = String(row[2]);
    let type = row[3];
    let furnitureData = row[4];
    
    // --- FIX: Handle Type being converted to Date/Time ---
    if (type instanceof Date) {
      // Check if it's the "1899" date which usually means it was just a time "1:00"
      const year = type.getFullYear();
      const hours = type.getHours();
      
      if (year === 1899 && hours === 1) {
        type = "1Am"; // Recover "1Am" from "1:00 AM"
      } else {
        type = String(type); 
      }
    } else {
      type = String(type);
      if (type === "1:00" || type === "01:00") {
        type = "1Am";
      }
    }
    // -----------------------------------------------------------
    
    let furniture = [];
    try {
      if (furnitureData && furnitureData !== '') {
        furniture = JSON.parse(furnitureData);
      }
    } catch (e) {
      furniture = [];
    }
    
    return {
      id: id,
      floor: floor,
      unitNo: unitNo,
      type: type,
      furniture: furniture
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, rooms: rooms }))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateFurnitureStatus(data) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.roomId)) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Room not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const furnitureCell = sheet.getRange(rowIndex, 5); // Column E
  let currentFurniture = [];
  const cellValue = furnitureCell.getValue();
  
  try {
    if (cellValue && cellValue !== '') {
      currentFurniture = JSON.parse(cellValue);
    }
  } catch (e) {
    currentFurniture = [];
  }
  
  const updatedFurniture = currentFurniture.map(item => {
    if ((item.code && item.code === data.furnitureId) || 
        (item.name && item.name === data.furnitureId) ||
        (data.furnitureId.startsWith('f-') && item.name === data.furnitureName)) {
      
      return {
        ...item,
        status: data.status,
        notes: data.notes || item.notes,
        images: data.images || item.images,
        installProgress: data.progress !== undefined ? data.progress : item.installProgress
      };
    }
    return item;
  });
  
  furnitureCell.setValue(JSON.stringify(updatedFurniture));
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveAllRooms(rooms) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  rooms.forEach(room => {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(room.id)) {
        // Update Type (Column D) - FORCE TEXT FORMAT
        const typeCell = sheet.getRange(i + 1, 4);
        typeCell.setNumberFormat('@'); // Set to Plain Text
        typeCell.setValue(room.type);
        
        // Update Furniture (Column E)
        const furnCell = sheet.getRange(i + 1, 5);
        furnCell.setValue(JSON.stringify(room.furniture));
        break;
      }
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getLayouts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Layouts');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, layouts: {} }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const layouts = {};
  
  for (let i = 1; i < data.length; i++) {
    layouts[data[i][0]] = JSON.parse(data[i][1]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, layouts: layouts }))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveLayout(roomType, layoutData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Layouts');
  if (!sheet) {
    sheet = ss.insertSheet('Layouts');
    sheet.appendRow(['Room Type', 'Layout JSON']);
  }
  
  const data = sheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === roomType) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(layoutData));
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([roomType, JSON.stringify(layoutData)]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```
