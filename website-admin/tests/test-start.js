const { createStrapi } = require('@strapi/strapi');
const path = require('path');
const fs = require('fs');

async function main() {
  try {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_CLIENT = 'sqlite';
    process.env.DATABASE_FILENAME = '.tmp/test.db';
    
    // clean up old test db
    const dbPath = path.join(__dirname, '../.tmp/test.db');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    
    const instance = createStrapi({ distDir: path.join(__dirname, '../dist') });
    await instance.load();
    console.log("DATABASE CONFIG:", JSON.stringify(instance.config.get('database.connection'), null, 2));
    await instance.start();
    console.log("Strapi started successfully!");
    await instance.destroy();
    process.exit(0);
  } catch (err) {
    console.error("Error starting strapi:", err);
  }
}

main();
