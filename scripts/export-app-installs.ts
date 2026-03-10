
import { adminDb } from '../lib/firebase-admin';
import * as fs from 'fs';
import * as Papa from 'papaparse';

async function exportAppInstalls() {
  try {
    console.log('🚀 Starting export of app_installs collection...');
    
    const snapshot = await adminDb.collection('app_installs').get();
    
    if (snapshot.empty) {
      console.log('⚠️ No documents found in app_installs collection.');
      process.exit(0);
    }

    console.log(`📦 Found ${snapshot.size} documents. Processing...`);

    const data: any[] = [];
    
    snapshot.forEach(doc => {
      const docData = doc.data();
      const processedRow: any = {
        _id: doc.id, // Include document ID
      };

      // Process all fields
      Object.keys(docData).forEach(key => {
        const val = docData[key];
        
        if (val === null || val === undefined) {
          processedRow[key] = '';
        } else if (typeof val === 'object') {
          // Handle Firestore Timestamps
          if (val.toDate && typeof val.toDate === 'function') {
            try {
                processedRow[key] = val.toDate().toISOString();
            } catch (e) {
                processedRow[key] = JSON.stringify(val);
            }
          } 
          // Handle Arrays and Objects
          else {
            try {
              processedRow[key] = JSON.stringify(val);
            } catch (e) {
              processedRow[key] = '[Circular/Error]';
            }
          }
        } else {
          processedRow[key] = val;
        }
      });
      
      data.push(processedRow);
    });

    const csv = Papa.unparse(data);
    const filename = 'app_installs_export.csv';
    
    fs.writeFileSync(filename, csv);
    
    console.log(`✅ Export completed successfully!`);
    console.log(`📄 File saved as: ${filename}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during export:', error);
    process.exit(1);
  }
}

exportAppInstalls();
