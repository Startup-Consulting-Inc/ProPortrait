#!/usr/bin/env node
/**
 * Migration script: Move all legacy tier users (creator, pro, max) to Plus tier
 * 
 * Usage:
 *   npx tsx server/scripts/migrateToPlus.ts [--dry-run]
 * 
 * Options:
 *   --dry-run    Preview changes without writing to Firestore
 */

import { adminFirestore } from '../lib/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const DRY_RUN = process.argv.includes('--dry-run');

// Credits to grant based on legacy tier
const CREDITS_MAP: Record<string, number> = {
  creator: 2,   // Creator had 30 generations → 2 downloads
  pro: 3,       // Pro had 100/month → 3 downloads  
  max: 5,       // Max had 500/month → 5 downloads
};

async function migrate() {
  console.log(`🔧 Starting migration${DRY_RUN ? ' (DRY RUN)' : ''}...\n`);

  const db = adminFirestore();
  
  // Find all users with legacy tiers
  const legacyTiers = ['creator', 'pro', 'max'];
  const usersToMigrate: Array<{
    uid: string;
    email: string;
    oldTier: string;
    newCredits: number;
  }> = [];

  for (const tier of legacyTiers) {
    const snap = await db
      .collection('users')
      .where('tier', '==', tier)
      .get();
    
    snap.docs.forEach(doc => {
      const data = doc.data();
      usersToMigrate.push({
        uid: doc.id,
        email: data.email || 'unknown',
        oldTier: tier,
        newCredits: CREDITS_MAP[tier],
      });
    });
  }

  // Also check isPro=true but no tier (edge case)
  const proSnap = await db
    .collection('users')
    .where('isPro', '==', true)
    .get();
  
  const existingUids = new Set(usersToMigrate.map(u => u.uid));
  proSnap.docs.forEach(doc => {
    if (!existingUids.has(doc.id)) {
      const data = doc.data();
      // Skip if already has a new tier
      if (data.tier === 'basic' || data.tier === 'plus') return;
      
      usersToMigrate.push({
        uid: doc.id,
        email: data.email || 'unknown',
        oldTier: data.tier || 'unknown',
        newCredits: 2, // Default for legacy pro users
      });
    }
  });

  if (usersToMigrate.length === 0) {
    console.log('✅ No users to migrate. All users are already on new tiers.');
    return;
  }

  // Group by old tier for summary
  const byTier: Record<string, number> = {};
  usersToMigrate.forEach(u => {
    byTier[u.oldTier] = (byTier[u.oldTier] || 0) + 1;
  });

  console.log(`Found ${usersToMigrate.length} users to migrate:\n`);
  Object.entries(byTier).forEach(([tier, count]) => {
    console.log(`  ${tier}: ${count} users → ${CREDITS_MAP[tier] || 2} credits each`);
  });
  console.log();

  // Show first 5 users as preview
  console.log('Preview (first 5):');
  usersToMigrate.slice(0, 5).forEach(u => {
    console.log(`  - ${u.email} (${u.uid.slice(0, 8)}...): ${u.oldTier} → plus (+${u.newCredits} credits)`);
  });
  if (usersToMigrate.length > 5) {
    console.log(`  ... and ${usersToMigrate.length - 5} more`);
  }
  console.log();

  if (DRY_RUN) {
    console.log('🏃 Dry run complete. No changes made.');
    console.log('Run without --dry-run to apply migration.');
    return;
  }

  // Confirm before proceeding
  console.log('⚠️  This will:');
  console.log('   - Change tier from legacy → "plus"');
  console.log('   - Add download credits based on old tier');
  console.log('   - Keep isPro = true');
  console.log('   - Preserve all other user data');
  console.log();

  // Apply migration
  console.log('Applying migration...\n');
  
  const batch = db.batch();
  let updated = 0;
  let errors = 0;

  for (const user of usersToMigrate) {
    try {
      const ref = db.collection('users').doc(user.uid);
      
      batch.update(ref, {
        tier: 'plus',
        isPro: true,
        downloadCredits: FieldValue.increment(user.newCredits),
        migratedFrom: user.oldTier,
        migratedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      updated++;

      // Commit every 500 operations (Firestore batch limit)
      if (updated % 500 === 0) {
        await batch.commit();
        console.log(`  Progress: ${updated}/${usersToMigrate.length}`);
      }
    } catch (err) {
      console.error(`  ❌ Error migrating ${user.uid}:`, err);
      errors++;
    }
  }

  // Commit remaining
  if (updated % 500 !== 0) {
    await batch.commit();
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Updated: ${updated} users`);
  console.log(`   Errors: ${errors} users`);
  console.log();
  console.log('Summary of credits granted:');
  Object.entries(byTier).forEach(([tier, count]) => {
    const total = count * (CREDITS_MAP[tier] || 2);
    console.log(`   ${tier}: ${count} users × ${CREDITS_MAP[tier] || 2} = ${total} credits`);
  });
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
