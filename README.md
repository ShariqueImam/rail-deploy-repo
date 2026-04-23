# MongoDB Viewer (JS)

Simple JavaScript app that:

- connects to MongoDB from `MONGODB_URI`
- fetches documents from 2 collections
- shows the data in a small UI

This is a good base before adding cron jobs.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Set your environment variables in `.env`:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
COLLECTION_ONE=first_collection_name
COLLECTION_TWO=second_collection_name
```

`COLLECTION_ONE` and `COLLECTION_TWO` are optional.  
If not set, the app automatically uses the first 2 collections in your database.

3. Start the app:

```bash
npm start
```

4. Open:

`http://localhost:3000`

## API

- `GET /health` -> health check (useful for Railway)
- `GET /api/data` -> returns up to 20 documents from each collection

## Deploy notes

### Railway

- Railway will use `npm start`
- Railway injects `PORT` automatically
- Add `MONGODB_URI` (and optional collection names) in Railway Variables

### GitHub

- `.env` is ignored via `.gitignore` (do not commit secrets)
- Keep secrets in GitHub Secrets / Railway Variables, not in repository files
