import { MongoClient, Db } from 'mongodb';

const mongoUri =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/crea_pdf';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(mongoUri);
    await client.connect();
  }
  return client;
}

export async function getDatabase(): Promise<Db> {
  if (!db) {
    const mongoClient = await getMongoClient();
    db = mongoClient.db();
  }
  return db;
}

export async function closeMongoConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}