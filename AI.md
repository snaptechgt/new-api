# AI.md — new-api (Backend API Service)

Guide for humans and AI agents working in this repository.

## What this is

**new-api** — a Node.js/Express backend service for:
- Uploading images, PDFs, and videos to Amazon S3
- Sending emails via AgentMail API (newsletter functionality)
- Serving assets with CORS headers for canvas reads

The entire service is a **backend API**: no frontend UI, no client-side routing. All data lives in AWS S3 and AgentMail. Called from frontend applications (like cfb-dashboard).

## Tech Stack

- **Runtime**: Node.js 20 (ESM, `type: "module"` in package.json)
- **Framework**: Express.js
- **Database**: Amazon S3 (file storage)
- **Email Service**: AgentMail API (transactional/boletín emails)
- **CORS**: Configured for cross-origin requests from cfb-dashboard
- **Auth**: Basic auth via `ACCESS_KEY` header for protected routes

## Quick start

```bash
# Install dependencies
npm install

# Or with Docker/Render:
# - Set AGENTMAIL_API_KEY as secret in Render dashboard
# - Ensure AWS creds are set as env vars
# - Start: npm start
```

## Architecture

```
Frontend (cfb-dashboard)                new-api (this service)
  │                                       │
  │   POST /v2/send/mail   {to, subject,   │
  │   html}  ──────────────►              │
  │                                       │ AgentMail API
  │   gets JSON response                    │
  │                                       ▼
  │                                       │ S3 Bucket
  │   GET /asset/:type/:key  ────────────►│ (images/videos)
  │   gets image URLs                       │
  │                                       ▼
  │   POST /single, /pdf, /video  ──────►│ upload files
```

## API Endpoints

### Email (AgentMail)

- **POST /v2/send/mail**
  - Body: `{ to, subject, html, from }`
  - Sends email via AgentMail API
  - Requires `AGENTMAIL_API_KEY` in environment
  - Free tier: 3,000 emails/month, 100/day
  - NO domain verification required
  - Returns: `{ success, data, error }`

### Asset Uploads (S3)

- **POST /single** - Upload single image
- **POST /pdf** - Upload single PDF  
- **POST /video** - Upload single video
- **GET /asset/:type/:key(*)** - Stream asset with CORS
  - `type`: img, videos, or pdfs
  - `key`: filename path

### Auth

- Basic auth via `Authorization: Basic <base64>` header
- Skip auth for: `GET /`, `GET /asset/*`, `OPTIONS *`
- Key configured via `ACCESS_KEY` env var (default: `Cfb123`)

## Environment Variables

| Variable | Required? | Description |
|----------|-----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `ACCESS_KEY` | Yes (for protected routes) | Auth key for API access |
| `AWSS3_BUCKET` | Yes | S3 bucket name |
| `AWSREGION` | Yes | AWS region (e.g., us-east-1) |
| `AWSACCESS_KEY_ID` | Yes | AWS access key ID |
| `AWSSECRET_ACCESS_KEY` | Yes | AWS secret access key |
| `AGENTMAIL_API_KEY` | Yes | AgentMail API key for sending emails |

For Render deployment, set `AGENTMAIL_API_KEY` as a **secret** (not in git).

## Security

- `AGENTMAIL_API_KEY` **never** reaches the browser — only the backend calls AgentMail
- `ACCESS_KEY` protects API routes (can be overridden for GET / and GET /asset/*)
- S3 bucket should have proper permissions; this backend adds CORS headers
- Input validation on all endpoints

## Deployment (Render)

1. Create new Web Service, Node.js plan
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Add Environment Variables in dashboard:
   - `AGENTMAIL_API_KEY` (as secret)
   - `AWSS3_BUCKET`, `AWSREGION`, `AWSACCESS_KEY_ID`, `AWSSECRET_ACCESS_KEY`
   - `ACCESS_KEY` (optional, default: `Cfb123`)
5. Service URL: `https://new-api-xxx.onrender.com`

All endpoints will be at `{url}/api/...` prefix if needed, or root as defined in routes.

## Development Notes

- CORS is configured for `http://localhost:5173` and `https://new-api-r82n.onrender.com` (cfb-dashboard URLs)
- Add your frontend's URL to the `corsOptions.origin` array in `src/index.js` if changing fronts
- The `streamObject` function in `s3.js` serves assets with CORS so browser canvas reads work without tainting
- AgentMail `from` address does NOT require domain verification on Free tier (e.g., `no-reply@cfb.dashboard.com` works out-of-the-box)
- **Inbox-based flow**: The code lists available inboxes via `GET /inboxes` and uses the first accessible inbox for sending emails via `POST /inboxes/{inbox_id}/messages/send`. This fixes the 404 'Route not found' error.
- **from address transformation**: The backend transforms the `from` field to display 'Iglesia CFB' as the sender name, regardless of what the frontend sends.
- Consider rotating `AGENTMAIL_API_KEY` if ever committed to git or exposed in chat

## Related Repos

- **cfb-dashboard** — Svelte/Vite frontend that calls these API endpoints
- **cfb-proyecta** — Main projection software (Vite + Svelte 5 + Tailwind v4 + InsForge)
