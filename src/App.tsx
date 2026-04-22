/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Pause } from 'lucide-react';

// --- Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const INITIAL_SPEED = 5;
const SPEED_INCREMENT = 0.001;
const PLAYER_SIZE = 40;
const OBSTACLE_MIN_GAP = 150;
const OBSTACLE_MAX_GAP = 400;

interface Obstacle {
  x: number;
  width: number;
  height: number;
  color: string;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'PAUSED'>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('tech-chayah-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Game Refs (to avoid re-renders during the loop)
  const playerY = useRef(CANVAS_HEIGHT - PLAYER_SIZE);
  const playerVelocity = useRef(0);
  const isJumping = useRef(false);
  const obstacles = useRef<Obstacle[]>([]);
  const gameSpeed = useRef(INITIAL_SPEED);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(null);
  const nextObstacleTime = useRef(0);

  const resetGame = useCallback(() => {
    playerY.current = CANVAS_HEIGHT - PLAYER_SIZE;
    playerVelocity.current = 0;
    isJumping.current = false;
    obstacles.current = [];
    gameSpeed.current = INITIAL_SPEED;
    setScore(0);
    nextObstacleTime.current = 0;
  }, []);

  const handleJump = useCallback(() => {
    if (gameState === 'PLAYING' && !isJumping.current) {
      playerVelocity.current = JUMP_FORCE;
      isJumping.current = true;
    } else if (gameState === 'START' || gameState === 'GAMEOVER') {
      startGame();
    }
  }, [gameState]);

  const startGame = () => {
    resetGame();
    setGameState('PLAYING');
  };

  const gameOver = useCallback(() => {
    setGameState('GAMEOVER');
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('tech-chayah-highscore', score.toString());
    }
  }, [score, highScore]);

  const update = (time: number) => {
    if (gameState !== 'PLAYING') return;

    if (lastTimeRef.current !== undefined) {
      // Update Player
      playerVelocity.current += GRAVITY;
      playerY.current += playerVelocity.current;

      if (playerY.current > CANVAS_HEIGHT - PLAYER_SIZE) {
        playerY.current = CANVAS_HEIGHT - PLAYER_SIZE;
        playerVelocity.current = 0;
        isJumping.current = false;
      }

      // Update Obstacles
      gameSpeed.current += SPEED_INCREMENT;
      
      if (time > nextObstacleTime.current) {
        const height = 30 + Math.random() * 50;
        const width = 20 + Math.random() * 30;
        obstacles.current.push({
          x: CANVAS_WIDTH,
          width,
          height,
          color: '#ff0055'
        });
        nextObstacleTime.current = time + (OBSTACLE_MIN_GAP + Math.random() * OBSTACLE_MAX_GAP) * (10 / gameSpeed.current);
      }

      obstacles.current = obstacles.current.filter(obs => {
        obs.x -= gameSpeed.current;

        // Collision Detection
        const playerRect = {
          left: 50,
          right: 50 + PLAYER_SIZE,
          top: playerY.current,
          bottom: playerY.current + PLAYER_SIZE
        };

        const obsRect = {
          left: obs.x,
          right: obs.x + obs.width,
          top: CANVAS_HEIGHT - obs.height,
          bottom: CANVAS_HEIGHT
        };

        if (
          playerRect.right > obsRect.left &&
          playerRect.left < obsRect.right &&
          playerRect.bottom > obsRect.top
        ) {
          gameOver();
        }

        return obs.x + obs.width > 0;
      });

      setScore(s => s + 1);
    }

    lastTimeRef.current = time;
    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Floor
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.stroke();

    // Draw Player
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f2ff';
    ctx.fillStyle = '#00f2ff';
    ctx.fillRect(50, playerY.current, PLAYER_SIZE, PLAYER_SIZE);

    // Draw Obstacles
    ctx.shadowColor = '#ff0055';
    ctx.fillStyle = '#ff0055';
    obstacles.current.forEach(obs => {
      ctx.fillRect(obs.x, CANVAS_HEIGHT - obs.height, obs.width, obs.height);
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col items-center gap-8">
        
        {/* Header */}
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black tracking-tighter italic uppercase text-[#00f2ff] drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]"
            id="game-title"
          >
            Tech Chayah
          </motion.h1>
          <p className="text-zinc-500 font-mono text-sm mt-2 uppercase tracking-widest">Avoid the void</p>
        </div>

        {/* Game Container */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00f2ff] to-[#ff0055] rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-[#0a0a0a] rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="max-w-full h-auto cursor-pointer"
              onClick={handleJump}
              id="game-canvas"
            />

            {/* UI Overlays */}
            <AnimatePresence>
              {gameState === 'START' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="bg-[#00f2ff] text-black px-8 py-4 rounded-full font-bold text-xl flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.4)]"
                    id="start-button"
                  >
                    <Play fill="currentColor" /> START GAME
                  </motion.button>
                  <p className="mt-4 text-zinc-400 font-mono text-xs uppercase tracking-widest">Press Space or Tap to Jump</p>
                </motion.div>
              )}

              {gameState === 'GAMEOVER' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md"
                >
                  <h2 className="text-4xl font-black text-[#ff0055] mb-2 italic uppercase">Game Over</h2>
                  <div className="text-center mb-8">
                    <p className="text-zinc-400 text-sm uppercase tracking-widest">Final Score</p>
                    <p className="text-5xl font-mono font-bold text-white">{Math.floor(score / 10)}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="bg-white text-black px-8 py-4 rounded-full font-bold text-xl flex items-center gap-2"
                    id="restart-button"
                  >
                    <RotateCcw /> TRY AGAIN
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Score HUD */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
              <div className="bg-black/50 backdrop-blur-md border border-white/10 p-2 rounded px-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Score</p>
                <p className="text-2xl font-mono font-bold leading-none">{Math.floor(score / 10)}</p>
              </div>
              <div className="bg-black/50 backdrop-blur-md border border-white/10 p-2 rounded px-4 text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex items-center justify-end gap-1">
                  <Trophy size={10} /> High Score
                </p>
                <p className="text-2xl font-mono font-bold leading-none text-[#00f2ff]">{Math.floor(highScore / 10)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions / Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Jump</p>
            <p className="text-sm font-medium">Space / Tap</p>
          </div>
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Goal</p>
            <p className="text-sm font-medium">Avoid Red Blocks</p>
          </div>
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Speed</p>
            <p className="text-sm font-medium">Increases over time</p>
          </div>
        </div>

      </div>
    </div>
  );
}
