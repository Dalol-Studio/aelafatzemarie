// Diagnostic script to check private photos
import { getPhotos } from './src/photo/query';

async function checkPrivatePhotos() {
  try {
    const photos = await getPhotos({ hidden: 'only', limit: 100 });
    
    console.log(`\n=== Found ${photos.length} private photos ===\n`);
    
    photos.forEach((photo, index) => {
      console.log(`${index + 1}. ID: ${photo.id}`);
      console.log(`   URL: ${photo.url || 'MISSING URL'}`);
      console.log(`   Title: ${photo.title || 'No title'}`);
      console.log(`   Taken At Naive: ${photo.takenAtNaive || 'MISSING DATE'}`);
      console.log(`   Extension: ${photo.extension || 'MISSING'}`);
      console.log('');
    });
    
    // Check for photos with missing data
    const missingUrl = photos.filter(p => !p.url);
    const missingDate = photos.filter(p => !p.takenAtNaive);
    
    console.log(`\n=== Issues Found ===`);
    console.log(`Photos with missing URL: ${missingUrl.length}`);
    console.log(`Photos with missing date: ${missingDate.length}`);
    
    if (missingUrl.length > 0) {
      console.log('\nPhotos with missing URLs:');
      missingUrl.forEach(p => console.log(`  - ${p.id}: ${p.title || 'No title'}`));
    }
    
    if (missingDate.length > 0) {
      console.log('\nPhotos with missing dates:');
      missingDate.forEach(p => console.log(`  - ${p.id}: ${p.title || 'No title'}`));
    }
    
  } catch (error) {
    console.error('Error checking photos:', error);
  }
  
  process.exit(0);
}

checkPrivatePhotos();
