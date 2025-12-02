
import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { Terminal, Zap, Trophy, Users, Play, RefreshCw, AlertCircle } from 'lucide-react';

// Connect to backend
const socket: Socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'] 
});

interface Player {
  id: string;
  username: string;
  progress: number;
  wpm: number;
}

interface Room {
  id: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  text: string;
}

export default function App() {
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('room1');
  const [room, setRoom] = useState<Room | null>(null);
  const [input, setInput] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Connection Debugging
    socket.on('connect', () => {
      console.log("Connected to server!", socket.id);
      setIsConnected(true);
    });

    socket.on('connect_error', (err) => {
      console.error("Connection Error:", err);
      setIsConnected(false);
    });

    // Switching view when room updates
    socket.on('room_update', (updatedRoom) => {
      setRoom(updatedRoom);
      setView('game');
      if (updatedRoom.status === 'waiting') setWinner(null);
    });

    socket.on('game_start', (updatedRoom) => {
      setRoom(updatedRoom);
      setView('game');
      setInput('');
      setWinner(null);
      setStartTime(Date.now());
      setTimeout(() => inputRef.current?.focus(), 100);
    });

    socket.on('player_update', (players) => {
      setRoom((prev) => prev ? { ...prev, players } : null);
    });

    socket.on('game_over', ({ winner }) => {
      setWinner(winner);
    });

    socket.on('error', (msg) => {
      alert(msg);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('room_update');
      socket.off('game_start');
      socket.off('player_update');
      socket.off('game_over');
      socket.off('error');
    };
  }, []);

  const joinRoom = () => {
    if (username && roomId) {
      socket.emit('join_room', { username, roomId });
    }
  };

  const restartGame = () => {
    if (room) {
      socket.emit('restart_game', { roomId: room.id });
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!room || room.status !== 'playing') return;
    
    const value = e.target.value;
    setInput(value);

    const targetText = room.text;
    let correctChars = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === targetText[i]) correctChars++;
      else break;
    }

    const progress = Math.min((correctChars / targetText.length) * 100, 100);
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; 
    const wpm = Math.round((correctChars / 5) / timeElapsed) || 0;

    socket.emit('type_progress', { roomId: room.id, progress, wpm });
  };

  if (view === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-mono selection:bg-yellow-500 selection:text-black">
        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-amber-600"></div>
          
          <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>

          <div className="flex justify-center mb-6">
            <div className="bg-yellow-400/10 p-4 rounded-full">
              <Zap className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-center mb-2 tracking-tighter">CodeDuel</h1>
          <p className="text-slate-500 text-center mb-8">1v1 Real-time Algorithm Race</p>
          
          {!isConnected && (
            <div className="bg-red-500/20 text-red-200 p-2 text-xs text-center rounded mb-4">
              Connecting to server... ensure backend is running!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Operator Name</label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-lg text-white outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                placeholder="e.g. Neo"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Access Code (Room)</label>
              <input 
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-lg text-white outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
                placeholder="e.g. room1"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
              />
            </div>
            <button 
              onClick={joinRoom}
              disabled={!isConnected}
              className={`w-full font-bold py-4 rounded-lg transition flex items-center justify-center gap-2 mt-4 ${isConnected ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              <Play className="w-5 h-5 fill-current" /> Initialize Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GAME VIEW
  const myPlayer = room?.players.find(p => p.username === username);
  const opponent = room?.players.find(p => p.username !== username);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-mono selection:bg-yellow-500 selection:text-black">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex justify-between items-center mb-12 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-yellow-400 font-bold text-2xl tracking-tighter">
            <Zap className="fill-current" /> CodeDuel
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-xs text-slate-500">Connected to: <span className="text-white">{room?.id}</span></div>
             <div className="bg-slate-800 px-4 py-1.5 rounded-full text-xs border border-slate-700 font-bold tracking-wider">
               STATUS: <span className={room?.status === 'playing' ? "text-green-400" : "text-yellow-400"}>{room?.status.toUpperCase()}</span>
             </div>
          </div>
        </header>

        {winner ? (
          <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-500 mb-10 bg-slate-900 p-10 rounded-2xl border border-slate-800 shadow-2xl">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            <h1 className="text-5xl font-bold mb-4">{winner === username ? "VICTORY" : "DEFEAT"}</h1>
            <p className="text-slate-400 mb-8">Winner: <span className="text-white font-bold">{winner}</span></p>
            <button 
              onClick={restartGame} 
              className="bg-yellow-400 text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-yellow-300 transition flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5" /> Rematch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* MY RACER */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
              <div className="flex justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2 text-xl"><Terminal className="w-5 h-5 text-yellow-400" /> You</h3>
                <div className="text-right">
                  <span className="text-3xl font-bold text-white block">{Math.round(myPlayer?.progress || 0)}%</span>
                  <span className="text-xs text-slate-500 font-bold tracking-wider">{myPlayer?.wpm} WPM</span>
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 transition-all duration-300 shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                  style={{ width: `${myPlayer?.progress}%` }}
                />
              </div>
            </div>

            {/* OPPONENT RACER */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden opacity-90">
              <div className="flex justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2 text-xl text-slate-400"><Users className="w-5 h-5" /> {opponent?.username || 'Searching...'}</h3>
                <div className="text-right">
                  <span className="text-3xl font-bold text-slate-400 block">{Math.round(opponent?.progress || 0)}%</span>
                  <span className="text-xs text-slate-600 font-bold tracking-wider">{opponent?.wpm || 0} WPM</span>
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-600 transition-all duration-300" 
                  style={{ width: `${opponent?.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* CODE AREA */}
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl relative min-h-[200px]">
          {room?.status === 'waiting' && (
             <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center z-10 rounded-2xl backdrop-blur-sm">
               <div className="text-center">
                 <div className="animate-spin w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-6"></div>
                 <p className="font-bold text-2xl mb-2">Awaiting Challenger...</p>
                 <p className="text-slate-500 text-sm bg-slate-800 py-2 px-4 rounded-lg inline-block font-mono">Room ID: {room?.id}</p>
               </div>
             </div>
          )}
          
          <div className="mb-6 font-mono text-xl leading-relaxed select-none pointer-events-none tracking-wide">
            {room?.text.split('').map((char, i) => {
              let color = 'text-slate-600';
              if (i < input.length) {
                color = input[i] === char ? 'text-green-400' : 'text-red-500 bg-red-500/10 rounded';
              }
              if (i === input.length) {
                return <span key={i} className="text-yellow-400 bg-yellow-400/20 border-b-2 border-yellow-400 animate-pulse">{char === ' ' ? ' ' : char}</span>;
              }
              return <span key={i} className={color}>{char}</span>;
            })}
          </div>

          <input 
            ref={inputRef}
            autoFocus
            disabled={room?.status !== 'playing'}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
            value={input}
            onChange={handleTyping}
            autoComplete="off"
          />
          
          {room?.status === 'playing' && (
            <div className="absolute bottom-4 right-6 text-xs text-slate-600 font-bold uppercase tracking-widest animate-pulse flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> System Active // Typing Enabled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
