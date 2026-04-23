const path = require("path");
const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const {
  PORT,
  MONGODB_URI,
  CLIENT_ORIGIN,
  COLLECTION_ONE,
  COLLECTION_TWO,
} = process.env;

const port = Number(PORT) || 3000;
const mongoUri = MONGODB_URI;
const clientOrigin = CLIENT_ORIGIN || "http://127.0.0.1:5501";
const localhostOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

if (!mongoUri) {
  throw new Error("MONGODB_URI is missing in .env");
}

let client;
let database;

async function connectMongo() {
  if (database) return database;

  client = new MongoClient(mongoUri);
  await client.connect();
  database = client.db();
  return database;
}

async function resolveCollections(db) {
  if (COLLECTION_ONE && COLLECTION_TWO) {
    return [COLLECTION_ONE, COLLECTION_TWO];
  }

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const names = collections.map((item) => item.name).slice(0, 2);

  if (names.length < 2) {
    throw new Error(
      "Could not find at least two collections. Set COLLECTION_ONE and COLLECTION_TWO in .env."
    );
  }

  return names;
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  return (
    origin === clientOrigin ||
    origin === "null" ||
    localhostOriginRegex.test(origin)
  );
}

function applyCorsHeaders(res, requestOrigin) {
  res.header(
    "Access-Control-Allow-Origin",
    requestOrigin === "null" ? "null" : requestOrigin
  );
  res.header("Vary", "Origin");
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.header(key, value);
  });
}

function mapUser(doc) {
  return { username: doc.username ?? "N/A" };
}

function resolveBalance(doc) {
  if (typeof doc.accountBalance === "number") return doc.accountBalance;
  if (typeof doc.balance === "number") return doc.balance;
  return 0;
}

function mapAccount(doc) {
  return {
    username: doc.username ?? doc.ownerUsername ?? "N/A",
    server: doc.serverName ?? doc.server ?? "N/A",
    balance: resolveBalance(doc),
  };
}

app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;

  if (isAllowedOrigin(requestOrigin)) {
    applyCorsHeaders(res, requestOrigin);
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/data", async (_req, res) => {
  try {
    const db = await connectMongo();
    const [usersCollectionName, accountsCollectionName] =
      await resolveCollections(db);

    const [usersData, accountsData] = await Promise.all([
      db.collection(usersCollectionName).find({}).toArray(),
      db.collection(accountsCollectionName).find({}).toArray(),
    ]);

    const users = usersData.map(mapUser);
    const accounts = accountsData.map(mapAccount);

    res.json({
      databaseName: db.databaseName,
      sourceCollections: {
        usersCollection: usersCollectionName,
        accountsCollection: accountsCollectionName,
      },
      users,
      accounts,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch data from MongoDB",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  if (client) {
    await client.close();
  }
  process.exit(0);
});
