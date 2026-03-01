/**
 * Vay Chinnakhet - Furniture Tracking System (v2.0)
 * 
 * INSTRUCTIONS:
 * 1. Copy this entire code into your Google Apps Script editor (Extensions > Apps Script).
 * 2. Save the project.
 * 3. Click "Deploy" > "New deployment".
 * 4. Select type: "Web app".
 * 5. Description: "v2.0 - Robust Sync".
 * 6. Execute as: "Me" (your email).
 * 7. Who has access: "Anyone" (IMPORTANT!).
 * 8. Click "Deploy".
 * 9. Copy the "Web App URL" and update it in your application settings.
 */

const SHEET_NAME = 'DB';
const LAYOUT_SHEET_NAME = 'Layouts';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  // Wait for up to 30 seconds for other processes to finish.
  lock.tryLock(30000);

  try {
    const action = e.parameter.action || (e.postData && JSON.parse(e.postData.contents).action);
    
    if (action === 'getRooms') {
      return getRooms();
    } else if (action === 'saveAll') {
      const data = JSON.parse(e.postData.contents);
      return saveAllRooms(data.rooms);
    } else if (action === 'updateStatus') {
      const data = JSON.parse(e.postData.contents);
      return updateRoomStatus(data.roomId, data.furniture);
    } else if (action === 'saveLayout') {
      const data = JSON.parse(e.postData.contents);
      return saveLayout(data.roomType, data.layout);
    } else {
      return createJSONOutput({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    return createJSONOutput({ success: false, message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getRooms() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // If sheet doesn't exist, return empty list (client will initialize)
  if (!sheet) {
    return createJSONOutput({ success: true, rooms: [], layouts: {} });
  }

  const data = sheet.getDataRange().getValues();
  const rooms = [];
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    try {
      rooms.push({
        id: String(row[0]),
        unitNo: String(row[1]),
        floor: Number(row[2]),
        type: String(row[3]),
        furniture: JSON.parse(row[4] || '[]')
      });
    } catch (e) {
      // Skip malformed rows
      console.error('Error parsing row ' + i, e);
    }
  }

  // Also fetch layouts
  const layouts = {};
  const layoutSheet = ss.getSheetByName(LAYOUT_SHEET_NAME);
  if (layoutSheet) {
    const layoutData = layoutSheet.getDataRange().getValues();
    for (let i = 1; i < layoutData.length; i++) {
      try {
        layouts[layoutData[i][0]] = JSON.parse(layoutData[i][1]);
      } catch (e) {}
    }
  }

  return createJSONOutput({ success: true, rooms: rooms, layouts: layouts });
}

function saveAllRooms(rooms) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'UnitNo', 'Floor', 'Type', 'FurnitureJSON']);
  } else {
    // Clear existing data but keep header
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    }
  }

  if (!rooms || rooms.length === 0) {
    return createJSONOutput({ success: true, message: 'Database cleared' });
  }

  // Prepare data for batch insertion
  const rows = rooms.map(room => [
    String(room.id),
    String(room.unitNo),
    Number(room.floor),
    String(room.type),
    JSON.stringify(room.furniture)
  ]);

  // Write in chunks to avoid timeouts if data is huge
  sheet.getRange(2, 1, rows.length, 5).setValues(rows);

  return createJSONOutput({ success: true, message: 'Saved ' + rows.length + ' rooms' });
}

function updateRoomStatus(roomId, furnitureItem) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) return createJSONOutput({ success: false, message: 'DB not found' });

  const data = sheet.getDataRange().getValues();
  let found = false;

  // Find the row with the matching room ID
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(roomId)) {
      const currentFurniture = JSON.parse(data[i][4] || '[]');
      
      // Update the specific furniture item
      const updatedFurniture = currentFurniture.map(item => {
        if (item.id === furnitureItem.id) {
          return furnitureItem;
        }
        return item;
      });

      // Write back the updated JSON
      sheet.getRange(i + 1, 5).setValue(JSON.stringify(updatedFurniture));
      found = true;
      break;
    }
  }

  if (found) {
    return createJSONOutput({ success: true });
  } else {
    return createJSONOutput({ success: false, message: 'Room not found' });
  }
}

function saveLayout(roomType, layout) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(LAYOUT_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(LAYOUT_SHEET_NAME);
    sheet.appendRow(['RoomType', 'LayoutJSON']);
  }

  const data = sheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === roomType) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(layout));
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([roomType, JSON.stringify(layout)]);
  }

  return createJSONOutput({ success: true });
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
