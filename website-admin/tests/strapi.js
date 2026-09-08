const { createStrapi } = require('@strapi/strapi');
const path = require('path');

const fs = require('fs');

let instance;

async function setupStrapi() {
  if (!instance) {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_CLIENT = 'sqlite';
    process.env.DATABASE_FILENAME = '.tmp/test.db';
    
    // Clean up old test db
    const dbPath = path.join(__dirname, '../.tmp/test.db');
    if (fs.existsSync(dbPath)) {
      try { fs.unlinkSync(dbPath); } catch (e) {}
    }

    // For tests, we use the compiled 'dist' directory to avoid TypeScript module issues.
    instance = await createStrapi({ distDir: path.join(__dirname, '../dist') }).load();
    await instance.start();
    global.strapi = instance;
  }
  return instance;
}

async function cleanupStrapi() {
  if (instance) {
    await instance.server.httpServer.close();
    if (instance.db) {
      await instance.db.connection.destroy();
    }
    await instance.destroy();
    
    // Clean up test db
    const dbPath = path.join(__dirname, '../.tmp/test.db');
    if (fs.existsSync(dbPath)) {
      try { fs.unlinkSync(dbPath); } catch (e) {}
    }
  }
}

module.exports = { setupStrapi, cleanupStrapi };
