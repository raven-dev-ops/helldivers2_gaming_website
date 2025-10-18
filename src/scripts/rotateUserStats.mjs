#!/usr/bin/env node
// Month-end rotation:
// 1) Rename User_Stats to a month-stamped temp
// 2) Merge all docs from the temp into Lifetime_Stats
// 3) Drop the temp and create a fresh empty User_Stats
// Usage: node src/scripts/rotateUserStats.mjs

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'GPTHellbot';

if (!uri) {
  console.error('MONGODB_URI missing');
  process.exit(1);
}

function pad(n) { return String(n).padStart(2, '0'); }

// Compute the month that just ended in local time
const now = new Date();
const prev = new Date(now.getFullYear(), now.getMonth(), 0); // day 0 of current month -> last day previous month
const year = prev.getFullYear();
const month = pad(prev.getMonth() + 1);
const tempName = `User_Stats_prev_${year}_${month}`;

async function main() {
  const client = new MongoClient(uri, { maxPoolSize: 3 });
  await client.connect();
  const db = client.db(dbName);
  const existing = await db.listCollections({ name: 'User_Stats' }).toArray();
  if (!existing.length) {
    console.log('No User_Stats collection to rotate. Exiting.');
    await client.close();
    return;
  }

  const destExists = await db.listCollections({ name: tempName }).toArray();
  if (destExists.length) {
    console.log(`Temp ${tempName} already exists. Skipping rename.`);
  } else {
    console.log(`Renaming User_Stats -> ${tempName}`);
    await db.collection('User_Stats').rename(tempName);
  }

  // Merge docs into Lifetime_Stats
  console.log(`Merging ${tempName} into Lifetime_Stats ...`);
  await db.collection(tempName).aggregate([
    { $match: {} },
    { $merge: { into: 'Lifetime_Stats', on: '_id', whenMatched: 'keepExisting', whenNotMatched: 'insert' } },
  ]).toArray();

  // Drop the temp
  console.log(`Dropping ${tempName} ...`);
  await db.collection(tempName).drop().catch(() => {});

  // Ensure fresh live collection exists
  const newExists = await db.listCollections({ name: 'User_Stats' }).toArray();
  if (!newExists.length) {
    console.log('Creating new User_Stats');
    await db.createCollection('User_Stats');
    // Helpful indexes
    await db.collection('User_Stats').createIndexes([
      { key: { submitted_at: 1 } },
      { key: { player_name: 1 } },
      { key: { discord_id: 1 } },
    ]);
  }

  console.log('Rotation complete.');
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
