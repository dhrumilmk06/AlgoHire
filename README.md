<div align="center">
  <!-- You can replace the src below with a custom logo if you have one -->
  <!-- <img src="https://raw.githubusercontent.com/dhrumilmk06/AlgoHire/main/public/vite.svg" alt="AlgoHire Logo" width="120" /> -->
  
  # AlgoHire
  **Revolutionizing DSA Learning & Technical Interviews with 3D Visualization**

  [![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
  [![Three.js](https://img.shields.io/badge/Three.js-3D_Graphics-black?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
  [![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
</div>

<br>

## 💡 Inspiration
Data Structures and Algorithms (DSA) are the backbone of computer science, yet they remain one of the most intimidating topics for students and interviewees. Static 2D diagrams and disconnected coding environments make it difficult to build a strong spatial and conceptual understanding. **AlgoHire** was born out of the need to bridge this gap by bringing algorithms to life in 3D and creating a seamless, collaborative environment for technical interviews.

## 🚀 What it does
AlgoHire is a comprehensive platform that combines **3D Interactive Learning** with **Collaborative Problem Solving**. 

- **Interactive 3D Visualizations**: Dive into Arrays, Stacks, Queues, Linked Lists, Trees, Graphs, Hash Tables, and Heaps in a fully interactive 3D environment. Watch sorting, searching, and pathfinding algorithms execute step-by-step with immersive controls.
- **LeetCode-Style Problem Set**: Practice with a curated list of DSA problems. Write your code in an integrated Monaco Editor and run it against predefined test cases in real-time. Get instant feedback on correctness and execution.
- **Multiplayer Interview Sessions**: Create private rooms and invite peers or interviewers. Code collaboratively with real-time keystroke synchronization, making it the ultimate tool for mock interviews and remote technical assessments.

## 🛠️ How we built it
We built AlgoHire with performance and real-time interaction in mind:
- **Frontend**: React 19, TypeScript, and Tailwind CSS provide a sleek, responsive UI. 
- **3D Graphics**: We utilized **Three.js** along with **React Three Fiber** and **Drei** to render performant, immersive 3D visualizations directly in the browser.
- **Real-Time Collaboration**: A **Node.js/Express** backend powered by **Socket.io** handles the real-time syncing of code editors and session states with sub-second latency.
- **Database & Authentication**: **Supabase** handles all PostgreSQL data management and seamless, secure user authentication.

## ⚙️ Local Setup Instructions

Want to run AlgoHire locally? Follow these steps:

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/dhrumilmk06/AlgoHire.git
   cd AlgoHire
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_BACKEND_URL=http://localhost:3000
   ```

4. Run the frontend and backend concurrently:
   ```bash
   npm run dev:all
   ```
   - Frontend runs on `http://localhost:5173`
   - Backend runs on `http://localhost:3000`

## ☁️ Deployment
- **Frontend**: Ready to be deployed on Vercel, Netlify, or Cloudflare Pages.
- **Backend**: Can be hosted on Render.com (Web Service), Fly.io, or Koyeb to support WebSockets.
- **Database**: Fully managed by Supabase.

## 🔮 What's Next for AlgoHire
- Adding WebRTC audio/video integration for live, face-to-face interview sessions.
- AI-powered hints and time/space complexity analysis for submitted code.
- More complex 3D visualizations for advanced algorithms (e.g., Dynamic Programming grids, advanced Graph traversal techniques).