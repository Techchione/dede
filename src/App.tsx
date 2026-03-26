/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Zap, Gauge, Shield } from 'lucide-react';
import { Game } from './components/Game';
import { GameStatus } from './types';

export default function App() {
  const [status, setStatus] = useState<GameStatus>('START');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('turbo-racer-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setStatus('GAMEOVER');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('turbo-racer-highscore', finalScore.toString());
    }
  }, [highScore]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setStatus('PLAYING');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center font-sans selection:bg-yellow-400 selection:text-black overflow-hidden">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <AnimatePresence mode="wait">
        {status === 'START' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="z-10 text-center max-w-md px-6"
          >
            <motion.div
              animate={{ rotate: [0, -2, 2, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="inline-block mb-6"
            >
              <Zap className="w-20 h-20 text-yellow-400 mx-auto" />
            </motion.div>
            
            <h1 className="text-6xl font-black tracking-tighter mb-2 italic">
              TURBO<span className="text-blue-500">RACER</span>
            </h1>
            <p className="text-gray-400 mb-8 font-medium uppercase tracking-widest text-sm">Arcade Speed Challenge</p>
            
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                <Gauge className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                <span className="text-[10px] block text-gray-500 font-bold">SPEED</span>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                <Shield className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <span className="text-[10px] block text-gray-500 font-bold">DODGE</span>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                <span className="text-[10px] block text-gray-500 font-bold">SCORE</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="group relative px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/40"
            >
              <span className="flex items-center gap-2">
                <Play className="fill-current" /> START ENGINE
              </span>
            </button>

            {highScore > 0 && (
              <div className="mt-8 text-gray-500 text-xs font-mono uppercase tracking-widest">
                BEST RECORD: <span className="text-yellow-500">{highScore}</span>
              </div>
            )}
            
            <div className="mt-12 text-gray-600 text-[10px] uppercase tracking-tighter">
              Use Arrow Keys or WASD to Move
            </div>
          </motion.div>
        )}

        {status === 'PLAYING' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 flex flex-col items-center"
          >
            <div className="mb-4 flex gap-8">
              <div className="text-center">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Score</div>
                <div className="text-3xl font-black font-mono text-yellow-400">{score}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Level</div>
                <div className="text-3xl font-black font-mono text-blue-400">{level}</div>
              </div>
            </div>

            <Game 
              onGameOver={handleGameOver} 
              onScoreUpdate={setScore}
              onLevelUpdate={setLevel}
              level={level}
            />
          </motion.div>
        )}

        {status === 'GAMEOVER' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 text-center bg-gray-900/80 backdrop-blur-xl p-12 rounded-[40px] border-4 border-red-500/30 shadow-2xl"
          >
            <h2 className="text-7xl font-black text-red-500 mb-2 italic tracking-tighter">CRASHED!</h2>
            <div className="h-1 w-24 bg-red-500 mx-auto mb-8" />
            
            <div className="space-y-4 mb-10">
              <div>
                <p className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-1">Final Score</p>
                <p className="text-6xl font-black text-white">{score}</p>
              </div>
              
              {score >= highScore && score > 0 && (
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-yellow-400 font-bold text-sm tracking-widest uppercase"
                >
                  New High Score!
                </motion.div>
              )}
            </div>

            <button
              onClick={startGame}
              className="flex items-center gap-3 mx-auto px-10 py-4 bg-white text-black font-black rounded-full hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <RotateCcw className="w-5 h-5" /> RESTART
            </button>
            
            <button
              onClick={() => setStatus('START')}
              className="mt-6 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Back to Menu
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed Lines Animation */}
      {status === 'PLAYING' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100, x: Math.random() * window.innerWidth }}
              animate={{ y: window.innerHeight + 100 }}
              transition={{ 
                duration: Math.random() * 0.5 + 0.2, 
                repeat: Infinity, 
                delay: Math.random() * 2,
                ease: "linear"
              }}
              className="absolute w-[1px] h-20 bg-white/10"
            />
          ))}
        </div>
      )}
    </div>
  );
}
