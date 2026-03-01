function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  // Wait for up to 30 seconds for other processes to finish.
  lock.tryLock(30000);

  try {
    var params = {};
    
    // Parse parameters
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        // If not JSON, maybe it's form data or plain text
        params = e.parameter || {};
      }
    } else {
      params = e.parameter || {};
    }

    var action = params.action || 'getRooms';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ensure sheets exist
    var dbSheet = ss.getSheetByName('DB');
    if (!dbSheet) {
      dbSheet = ss.insertSheet('DB');
      dbSheet.appendRow(['ID', 'UnitNo', 'Floor', 'Type', 'FurnitureJSON', 'LastUpdated']);
    }

    var layoutSheet = ss.getSheetByName('Layouts');
    if (!layoutSheet) {
      layoutSheet = ss.insertSheet('Layouts');
      layoutSheet.appendRow(['RoomType', 'LayoutJSON', 'LastUpdated']);
    }

    var result = { success: true };

    if (action === 'getRooms') {
      // 1. Get Rooms Data
      var rows = dbSheet.getDataRange().getValues();
      var rooms = [];
      
      // Skip header row
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        if (row[0]) { // If ID exists
          try {
            var furniture = [];
            if (row[4] && row[4] !== '') {
              furniture = JSON.parse(row[4]);
            }
            
            rooms.push({
              id: String(row[0]),
              unitNo: String(row[1]),
              floor: Number(row[2]),
              type: String(row[3]),
              furniture: furniture
            });
          } catch (err) {
            console.error('Error parsing row ' + i + ': ' + err);
          }
        }
      }
      result.rooms = rooms;

      // 2. Get Layouts Data
      var layoutRows = layoutSheet.getDataRange().getValues();
      var layouts = {};
      
      // Skip header row
      for (var j = 1; j < layoutRows.length; j++) {
        var lRow = layoutRows[j];
        if (lRow[0] && lRow[1]) {
          try {
            layouts[String(lRow[0])] = JSON.parse(lRow[1]);
          } catch (err) {
            console.error('Error parsing layout ' + j + ': ' + err);
          }
        }
      }
      result.layouts = layouts;

    } else if (action === 'saveAll') {
      var newRooms = params.rooms;
      if (newRooms && newRooms.length > 0) {
        // Clear existing data (except header)
        var lastRow = dbSheet.getLastRow();
        if (lastRow > 1) {
          dbSheet.getRange(2, 1, lastRow - 1, 6).clearContent();
        }

        var dataToSave = newRooms.map(function(room) {
          return [
            room.id,
            room.unitNo,
            room.floor,
            room.type,
            JSON.stringify(room.furniture),
            new Date()
          ];
        });

        // Batch write
        if (dataToSave.length > 0) {
          dbSheet.getRange(2, 1, dataToSave.length, 6).setValues(dataToSave);
        }
      }
      result.message = 'Saved ' + (newRooms ? newRooms.length : 0) + ' rooms';

    } else if (action === 'updateStatus') {
      var roomId = String(params.roomId);
      var furnitureItem = params.furniture; // Single item object
      
      if (roomId && furnitureItem) {
        var data = dbSheet.getDataRange().getValues();
        var rowIndex = -1;
        var currentFurniture = [];

        // Find the row
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][0]) === roomId) {
            rowIndex = i;
            try {
              currentFurniture = JSON.parse(data[i][4]);
            } catch (e) {
              currentFurniture = [];
            }
            break;
          }
        }

        if (rowIndex > 0) {
          // Update the specific item in the list
          var itemIndex = currentFurniture.findIndex(function(f) { return f.id === furnitureItem.id; });
          
          if (itemIndex >= 0) {
            currentFurniture[itemIndex] = furnitureItem;
          } else {
            // Item not found? Add it? Or ignore?
            // Let's try to match by code if ID failed (migration case)
            var codeIndex = currentFurniture.findIndex(function(f) { return f.code === furnitureItem.code; });
            if (codeIndex >= 0) {
              currentFurniture[codeIndex] = furnitureItem;
            } else {
               currentFurniture.push(furnitureItem);
            }
          }

          // Save back
          dbSheet.getRange(rowIndex + 1, 5).setValue(JSON.stringify(currentFurniture));
          dbSheet.getRange(rowIndex + 1, 6).setValue(new Date());
          result.message = 'Updated room ' + roomId;
        } else {
          result.error = 'Room not found';
        }
      }

    } else if (action === 'saveLayout') {
      var roomType = String(params.roomType);
      var layout = params.layout; // Array of objects

      if (roomType && layout) {
        var data = layoutSheet.getDataRange().getValues();
        var rowIndex = -1;

        // Find existing layout for this type
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][0]) === roomType) {
            rowIndex = i;
            break;
          }
        }

        var jsonLayout = JSON.stringify(layout);
        var timestamp = new Date();

        if (rowIndex > 0) {
          // Update existing
          layoutSheet.getRange(rowIndex + 1, 2).setValue(jsonLayout);
          layoutSheet.getRange(rowIndex + 1, 3).setValue(timestamp);
        } else {
          // Append new
          layoutSheet.appendRow([roomType, jsonLayout, timestamp]);
        }
        result.message = 'Layout saved for ' + roomType;
      } else {
        result.error = 'Missing roomType or layout';
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
