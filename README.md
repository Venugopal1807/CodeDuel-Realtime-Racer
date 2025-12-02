# CodeDuel (Real-time Typing Racer)

A high-performance, real-time multiplayer game where two developers race to type code snippets. Built to demonstrate low-latency communication using WebSockets.

## Key Features

**Real-Time Synchronization:** Uses Socket.io to sync typing progress, WPM (Words Per Minute), and game state instantly between clients.

**Lobby System:** Dynamic room creation and joining logic. The game automatically waits for a second player before starting.

**Live WPM Calculation:** Tracks typing speed in real-time and broadcasts it to the opponent.

**Instant Rematch:** Implemented server-side state reset features, allowing players to restart the game immediately without disconnecting or refreshing the page.

## Tech Stack

**Communication:** Socket.io (WebSockets) with explicit CORS handling.

**Backend:** Node.js, Express.

**Frontend:** React (Vite), Tailwind CSS.

## Quick Start (Run Locally)

Note: Since this is a multiplayer game, you must open the app in two separate browser windows to simulate two players.

### Step 1: Start the Game Server

The server runs on Port 3001.

Open a terminal in the root folder.

### Navigate to the server directory and install dependencies:

cd server
npm install


### Start the server:

npm run dev


Note: You should see like 'CodeDuel Server is RUNNING!'

### Step 2: Start the Client

The client runs on Port 5173.

Open a new terminal window.

### Navigate to the client directory and install dependencies:

cd client
npm install


### Start the React app:

npm run dev


## How to Play (The "Two-Tab" Method)

### Player 1:

Open http://localhost:5173 in your browser.

**Enter Name:** "Neo".

**Enter Room ID:** "Matrix".

Click Initialize Link.

Status will show: "Awaiting Challenger..."

### Player 2:

Open a New Tab (or Incognito Window).

Go to http://localhost:5173.

**Enter Name:** "Morpheus".

**Enter Room ID:** "Matrix" (Must match Player 1).

Click Initialize Link.

**Race:**

As soon as Player 2 joins, the game starts instantly on both screens.

Type the code snippet shown. The progress bars update in real-time!

Built for assignment submission.