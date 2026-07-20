/* eslint-disable @typescript-eslint/no-require-imports */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('📝 Prepare Migration (Safe Mode)\n');
    console.log('This script generates a SQL migration file based on your schema changes.');
    console.log('It will NOT apply the changes to your database.\n');

    try {
        // 1. Get Migration Name
        let name = process.argv[2];
        if (!name) {
            name = await question('Enter migration name (e.g. add_posts): ');
        }
        name = name.trim().replace(/\s+/g, '_').toLowerCase();

        if (!name) {
            console.error('❌ Migration name is required.');
            process.exit(1);
        }

        // 2. Find next z_ sequence number
        const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            fs.mkdirSync(migrationsDir, { recursive: true });
        }

        const startNum = 1;
        let nextNum = startNum;

        const dirs = fs.readdirSync(migrationsDir).filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory());

        // Find highest z_XXXX number
        let maxId = 0;
        dirs.forEach(dir => {
            const match = dir.match(/^z_(\d{4})_/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) maxId = num;
            }
        });

        nextNum = maxId + 1;
        const prefix = 'z_' + nextNum.toString().padStart(4, '0');
        const folderName = `${prefix}_${name}`;
        const targetDir = path.join(migrationsDir, folderName);

        console.log(`\n📂 Creating directory: prisma/migrations/${folderName}`);
        fs.mkdirSync(targetDir, { recursive: true });

        // 3. Generate SQL using prisma migrate diff
        console.log('⚙️  Generating SQL...');

        // We need to load env to get DATABASE_URL for the "from" state
        require('dotenv').config();

        // Prisma 6 reads the current database URL from the schema datasource and
        // compares it with the target datamodel without applying any changes.
        const command = [
            'npx prisma migrate diff',
            '--from-schema-datasource prisma/schema.prisma',
            '--to-schema-datamodel prisma/schema.prisma',
            '--script',
        ].join(' ');

        const sql = execSync(command).toString();

        if (!sql || sql.trim() === '') {
            console.log('⚠️  No changes detected between database and schema.');
            console.log('   Cleaning up empty directory...');
            fs.rmdirSync(targetDir);
            return;
        }

        const filePath = path.join(targetDir, 'migration.sql');

        // Add header
        const fileContent = `/*
  Migration: ${folderName}
  Description: ${name.replace(/_/g, ' ')}
  Date: ${newjkDate().toISOString()}
*/

${sql}

/*
  ROLLBACK PLAN:
  -- Write your rollback SQL here
*/
`;

        fs.writeFileSync(filePath, fileContent);

        console.log(`\n✅ Migration drafted: ${filePath}`);
        console.log('👉 Action Required: Review the SQL file, then run "npx prisma migrate deploy" to apply.');
        console.log('💡 Tip: If this migration generates SQL you already saw, you likely have pending migrations to apply.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exitCode = 1;
    } finally {
        rl.close();
    }
}

function newjkDate() { return new Date(); }

main();
