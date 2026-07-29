# CampusConnect

A full-stack campus community platform where college societies manage their presence and students stay connected, featuring real-time group chat, personalized feeds, team management, and more.

---

## Features

### Student
- Register/login with JWT authentication
- Discover and follow/unfollow societies
- Personalized feed (posts from followed societies)
- Browse and search events, recruitments, and announcements with pagination
- Real-time group chat with society teams (Socket.io)
- View team members and internal announcements for societies you belong to
- Profile modal with following list and society memberships

### Society
- Register with logo upload (Cloudinary)
- Create and manage posts (images/videos)
- Post events, recruitment drives, and public announcements
- Manage team members with roles/positions
- Post internal team announcements (visible only to members)
- Real-time group chat with team: send text and media, delete any message

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Real-time | Socket.io |
| File Uploads | Multer, Cloudinary |
| HTTP Client | Axios |
| Notifications | react-hot-toast |

---

## Project Structure

```
CampusConnect/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── context/         # AppContext (global auth state + backendUrl)
│       ├── pages/
│       │   ├── student/     # Feed, Discover, Events, Recruitment, Announcements, MySocieties
│       │   └── society/     # PostSection, EventManager, TeamManager, etc.
│       └── components/      # GroupChat, PostCard, PostLightbox, SocietyCard
│
└── server/                  # Express backend
    ├── controllers/         # Business logic per feature
    ├── models/              # Mongoose schemas
    ├── routes/              # API route definitions
    ├── middleware/          # JWT auth, role check
    └── utils/               # Cloudinary upload, pagination helper
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for media uploads)

### 1. Clone the repo
```bash
git clone https://github.com/your-username/campus-connect.git
cd campus-connect
```

### 2. Set up the server
```bash
cd server
npm install
```

Create a `.env` file in the `server/` folder:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=8000
```

### 3. Set up the client
```bash
cd client
npm install
```

Create a `.env` file in the `client/` folder:
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

### 4. Run the app
```bash
# Terminal 1 - start backend
cd server
npm run server

# Terminal 2 - start frontend
cd client
npm run dev
```

App runs at `http://localhost:5173`

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/student/register` | Register student |
| POST | `/api/auth/student/login` | Login student |
| POST | `/api/auth/society/register` | Register society |
| POST | `/api/auth/society/login` | Login society |
| GET | `/api/auth/me` | Get current user profile |
| DELETE | `/api/auth/me` | Delete account (cascade) |
| GET | `/api/societies` | Get all societies (paginated) |
| POST | `/api/follow/:societyId` | Follow a society |
| DELETE | `/api/follow/:societyId` | Unfollow a society |
| GET | `/api/follow/feed` | Get personalized feed (paginated) |
| GET | `/api/posts/:societyId` | Get society's posts (paginated) |
| GET | `/api/events` | Get all events (paginated) |
| GET | `/api/recruitments` | Get all recruitments (paginated) |
| GET | `/api/announcements` | Get all announcements (paginated) |
| GET | `/api/team/my-societies` | Get student's society memberships |
| GET | `/api/messages/:societyId` | Get chat history for a society |

---

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_room` | Client → Server | Join a society's chat room |
| `send_message` | Client → Server | Send text/media message |
| `delete_message` | Client → Server | Unsend a message (sender or admin) |
| `receive_message` | Server → Client | Broadcast new message to room |
| `message_deleted` | Server → Client | Broadcast deletion to room |
| `leave_room` | Client → Server | Leave the chat room |

---

## Key Design Decisions

- **JWT over sessions** - stateless auth, scales horizontally without shared session store
- **Socket.io rooms** - each society has an isolated room, messages only go to members of that room
- **rollNo as team link** - societies add members by roll number; students are matched at login without needing their account ID
- **Cascade deletes** - deleting an account removes all associated posts, events, messages, team records, and following references in one atomic `Promise.all`
- **Pagination** - all list endpoints use skip/limit with a `hasMore` flag; frontend appends on "Load More"
- **Cloudinary** - files go to memory via multer, then streamed to Cloudinary as base64; no disk storage needed on the server


