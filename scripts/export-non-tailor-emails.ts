
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccount = require('../stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function exportNonTailorEmails() {
  console.log('🚀 Starting export of non-tailor users...');

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('is_tailor', '==', false).get();

    if (snapshot.empty) {
      console.log('No matching users found.');
      return;
    }

    console.log(`✅ Found ${snapshot.size} users.`);

    const emails: string[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) {
        emails.push(data.email);
      }
    });

    console.log(`Found ${emails.length} emails.`);

    const csvContent = 'email\n' + emails.join('\n');
    const outputPath = path.join(process.cwd(), 'non_tailor_users.csv');

    fs.writeFileSync(outputPath, csvContent);

    console.log(`\n🎉 Export successful! Data written to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error exporting users:', error);
  }
}

exportNonTailorEmails();
