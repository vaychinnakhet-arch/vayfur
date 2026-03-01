// 1. ไปที่ https://script.google.com/
// 2. สร้างโปรเจกต์ใหม่
// 3. ลบโค้ดเก่าทั้งหมด แล้ววางโค้ดนี้ลงไป
// 4. กด Save (รูปแผ่นดิสก์)
// 5. กด Deploy (ปุ่มสีน้ำเงินมุมขวาบน) -> New Deployment
// 6. เลือก type เป็น "Web App"
// 7. Description: ใส่ "v1" หรืออะไรก็ได้
// 8. Execute as: "Me" (ตัวคุณเอง)
// 9. Who has access: "Anyone" (ทุกคน) **สำคัญมาก**
// 10. กด Deploy และ Copy URL มาใส่ในโปรแกรม

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  // รอได้สูงสุด 30 วินาที เพื่อป้องกันการเขียนทับกัน
  lock.tryLock(30000);

  try {
    // อ่าน action จาก GET parameter หรือ POST body
    let action = e.parameter.action;
    let payload = {};
    
    if (!action && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
        action = payload.action;
      } catch (err) {
        // invalid json
      }
    }

    if (action === 'getRooms') {
      return getRooms();
    } else if (action === 'updateStatus') {
      return updateStatus(payload);
    } else if (action === 'saveLayout') {
      return saveLayout(payload);
    } else if (action === 'saveAll') {
      return saveAll(payload);
    } else {
      return responseJSON({ success: false, message: 'Unknown action: ' + action });
    }

  } catch (error) {
    return responseJSON({ success: false, message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getRooms() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB');
  
  if (!sheet) {
    // ถ้าไม่มี sheet DB ให้สร้างใหม่และคืนค่าว่าง
    return responseJSON({ success: true, rooms: [], message: 'DB sheet created' });
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return responseJSON({ success: true, rooms: [] });
  }

  // แถวที่ 1 เป็น Header, ข้อมูลเริ่มแถวที่ 2
  // เราเก็บข้อมูล JSON ทั้งก้อนไว้ในคอลัมน์ A (index 0)
  const rows = data.slice(1);
  
  const rooms = rows.map(row => {
    try {
      return JSON.parse(row[0]);
    } catch (e) {
      return null;
    }
  }).filter(r => r !== null);

  // อ่าน Layouts ด้วย
  const layoutSheet = ss.getSheetByName('Layouts');
  let layouts = {};
  if (layoutSheet) {
    const layoutData = layoutSheet.getDataRange().getValues();
    // เริ่มแถว 2
    for (let i = 1; i < layoutData.length; i++) {
        const row = layoutData[i];
        if (row[0] && row[1]) {
            try {
            layouts[row[0]] = JSON.parse(row[1]);
            } catch (e) {}
        }
    }
  }

  return responseJSON({ success: true, rooms: rooms, layouts: layouts });
}

function saveAll(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB');
  if (!sheet) {
    sheet = ss.insertSheet('DB');
    sheet.appendRow(['DataJSON']); // Header
  }
  
  if (!payload.rooms || !Array.isArray(payload.rooms)) {
    return responseJSON({ success: false, message: 'Invalid rooms data' });
  }

  // แปลงข้อมูลเป็น string เพื่อเก็บใน cell เดียว
  const rows = payload.rooms.map(r => [JSON.stringify(r)]);
  
  // ล้างข้อมูลเก่าและเขียนใหม่ (สำหรับ saveAll)
  sheet.clearContents();
  sheet.appendRow(['DataJSON']);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 1).setValues(rows);
  }
  
  return responseJSON({ success: true });
}

function updateStatus(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB');
  if (!sheet) {
      // ถ้ายังไม่มี DB ให้สร้างใหม่ (กรณีเริ่มใช้งานครั้งแรก)
      sheet = ss.insertSheet('DB');
      sheet.appendRow(['DataJSON']);
      return responseJSON({ success: false, message: 'Database was empty, please Sync first' });
  }

  const data = sheet.getDataRange().getValues();
  const roomId = payload.roomId;
  const furnitureItem = payload.furniture;

  let found = false;
  // วนหาห้องที่ต้องการอัปเดต
  for (let i = 1; i < data.length; i++) {
    try {
      let room = JSON.parse(data[i][0]);
      if (room.id === roomId) {
        // เจอห้องแล้ว อัปเดตเฟอร์นิเจอร์ชิ้นนั้น
        const fIndex = room.furniture.findIndex(f => f.id === furnitureItem.id);
        if (fIndex !== -1) {
          room.furniture[fIndex] = furnitureItem;
        } else {
          // ถ้าไม่เจอ item (อาจจะเพิ่งเพิ่ม) ให้ push เข้าไป
          room.furniture.push(furnitureItem);
        }
        
        // เขียนกลับลงไปใน Sheet
        sheet.getRange(i + 1, 1).setValue(JSON.stringify(room));
        found = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!found) {
    return responseJSON({ success: false, message: 'Room not found' });
  }
  
  return responseJSON({ success: true });
}

function saveLayout(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Layouts');
  if (!sheet) {
    sheet = ss.insertSheet('Layouts');
    sheet.appendRow(['Type', 'Data']);
  }
  
  const type = payload.roomType;
  const layoutJson = JSON.stringify(payload.layout);
  
  const data = sheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === type) {
      sheet.getRange(i + 1, 2).setValue(layoutJson);
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([type, layoutJson]);
  }
  
  return responseJSON({ success: true });
}
