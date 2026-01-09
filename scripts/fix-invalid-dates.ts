// Script to fix invalid taken_at_naive dates in the database
import { sql } from '@/platforms/postgres';

async function fixInvalidDates() {
  console.log('Starting to fix invalid dates...\n');

  try {
    // Find all photos with invalid taken_at_naive format
    // Valid format should be: YYYY-MM-DD HH:MM:SS
    // Invalid ones might be: "YYYY-MM-DD " or other malformed strings
    
    const { rows: invalidPhotos } = await sql<{
      id: string;
      taken_at_naive: string;
      taken_at: string;
    }>`
      SELECT id, taken_at_naive, taken_at
      FROM photos
      WHERE 
        taken_at_naive IS NOT NULL
        AND (
          -- Check for trailing spaces
          taken_at_naive ~ '\\s+$'
          -- Or check if it doesn't match the expected format
          OR taken_at_naive !~ '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$'
        )
      ORDER BY id
    `;

    console.log(`Found ${invalidPhotos.length} photos with invalid dates\n`);

    if (invalidPhotos.length === 0) {
      console.log('No invalid dates found. All good!');
      return;
    }

    // Display the invalid dates
    console.log('Invalid dates found:');
    invalidPhotos.forEach((photo, index) => {
      console.log(`${index + 1}. Photo ID: ${photo.id}`);
      console.log(`   taken_at_naive: "${photo.taken_at_naive}"`);
      console.log(`   taken_at: ${photo.taken_at}`);
      console.log('');
    });

    // Fix each invalid date
    let fixedCount = 0;
    for (const photo of invalidPhotos) {
      let fixedDate: string;

      // Try to parse and fix the date
      const trimmed = photo.taken_at_naive.trim();
      
      if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // If it's just a date (YYYY-MM-DD), add time
        fixedDate = `${trimmed} 00:00:00`;
      } else if (trimmed.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
        // If it's missing seconds
        fixedDate = `${trimmed}:00`;
      } else {
        // Use the taken_at timestamp as fallback
        const takenAt = new Date(photo.taken_at);
        const year = takenAt.getFullYear();
        const month = String(takenAt.getMonth() + 1).padStart(2, '0');
        const day = String(takenAt.getDate()).padStart(2, '0');
        const hours = String(takenAt.getHours()).padStart(2, '0');
        const minutes = String(takenAt.getMinutes()).padStart(2, '0');
        const seconds = String(takenAt.getSeconds()).padStart(2, '0');
        fixedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      // Update the database
      await sql`
        UPDATE photos
        SET taken_at_naive = ${fixedDate}
        WHERE id = ${photo.id}
      `;

      console.log(`✓ Fixed photo ${photo.id}: "${photo.taken_at_naive}" → "${fixedDate}"`);
      fixedCount++;
    }

    console.log(`\n✅ Successfully fixed ${fixedCount} photos!`);

  } catch (error) {
    console.error('❌ Error fixing dates:', error);
    throw error;
  }
}

// Run the script
fixInvalidDates()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
