import { Client } from 'pg';

const setupDatabase = async () => {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: 'postgres',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres'
  });

  try {
    await client.connect();
    
    // Create database if not exists
    await client.query(`
      CREATE DATABASE ${process.env.POSTGRES_DB || 'socratic_learning'}
    `).catch(() => console.log('Database already exists'));
    
    console.log('✓ Database setup complete');
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    await client.end();
  }
};

setupDatabase();
