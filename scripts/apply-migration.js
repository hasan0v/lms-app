#!/usr/bin/env node

/**
 * Migration Application Script
 * 
 * This script helps apply database migrations to your Supabase project.
 * Usage: node scripts/apply-migration.js <migration-name>
 * 
 * Example: node scripts/apply-migration.js add_performance_indexes
 */

const fs = require('fs');
const path = require('path');

function applyMigration(migrationName) {
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', `${migrationName}.sql`);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    console.log('\n📁 Available migrations:');
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    files.forEach(file => console.log(`   - ${file.replace('.sql', '')}`));
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(`📋 Migration: ${migrationName}`);
  console.log('=' .repeat(50));
  console.log(migrationSQL);
  console.log('=' .repeat(50));
  
  console.log('\n🔧 To apply this migration:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL above');
  console.log('4. Click "Run" to execute the migration');
  console.log('\n⚠️  Always backup your database before applying migrations!');
  
  // Optional: save to clipboard if on supported platform
  console.log('\n💡 Tip: The SQL has been printed above for easy copying');
}

// Get migration name from command line arguments
const migrationName = process.argv[2];

if (!migrationName) {
  console.log('Usage: node scripts/apply-migration.js <migration-name>');
  console.log('\nExample: node scripts/apply-migration.js add_performance_indexes');
  
  // List available migrations
  const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    console.log('\n📁 Available migrations:');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    files.forEach(file => console.log(`   - ${file.replace('.sql', '')}`));
  }
  process.exit(1);
}

applyMigration(migrationName);