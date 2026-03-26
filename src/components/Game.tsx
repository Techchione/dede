import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Car, Obstacle, GameStatus } from '../types';

interface GameProps {
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onLevelUpdate: (level: number) => void;
  level: number;
}

const LANE_COUNT = 3;
const ROAD_WIDTH = 300;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 70;

export const Game: React.FC<GameProps> = ({ onGameOver, onScoreUpdate, onLevelUpdate, level }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const requestRef = useRef<number>(null);
  
  // Game state refs (to avoid closure issues in game loop)
  const playerRef = useRef<Car>({
    x: ROAD_WIDTH / 2 - CAR_WIDTH / 2,
    y: 500,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    color: '#3b82f6',
    speed: 5
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const roadOffsetRef = useRef(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const currentScoreRef = useRef(0);
  const currentLevelRef = useRef(level);

  useEffect(() => {
    currentLevelRef.current = level;
  }, [level]);

  const spawnObstacle = useCallback(() => {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const laneWidth = ROAD_WIDTH / LANE_COUNT;
    const x = lane * laneWidth + (laneWidth - CAR_WIDTH) / 2;
    
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const newObstacle: Obstacle = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y: -CAR_HEIGHT,
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
      speed: 3 + currentLevelRef.current * 0.8,
      type: 'car',
      color
    };
    
    obstaclesRef.current.push(newObstacle);
  }, []);

  const update = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Move road
    const roadSpeed = 5 + currentLevelRef.current * 1.5;
    roadOffsetRef.current = (roadOffsetRef.current + roadSpeed) % 40;

    // Move player
    const player = playerRef.current;
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
      player.x = Math.max(0, player.x - player.speed);
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
      player.x = Math.min(ROAD_WIDTH - player.width, player.x + player.speed);
    }

    // Spawn obstacles
    spawnTimerRef.current += deltaTime;
    const spawnInterval = Math.max(800, 2000 - currentLevelRef.current * 200);
    if (spawnTimerRef.current > spawnInterval) {
      spawnObstacle();
      spawnTimerRef.current = 0;
    }

    // Update obstacles
    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.y += obs.speed;
      
      // Collision detection
      if (
        player.x < obs.x + obs.width &&
        player.x + player.width > obs.x &&
        player.y < obs.y + obs.height &&
        player.y + player.height > obs.y
      ) {
        onGameOver(currentScoreRef.current);
        return false;
      }
      
      return obs.y < 600; // Keep if on screen
    });

    // Update score
    currentScoreRef.current += 1;
    if (currentScoreRef.current % 5 === 0) {
      onScoreUpdate(currentScoreRef.current);
      setScore(currentScoreRef.current);
    }
    
    // Level up logic
    const nextLevel = Math.floor(currentScoreRef.current / 1000) + 1;
    if (nextLevel > currentLevelRef.current) {
      onLevelUpdate(nextLevel);
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [onGameOver, onScoreUpdate, onLevelUpdate, spawnObstacle]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw road lines
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -roadOffsetRef.current;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo((ROAD_WIDTH / LANE_COUNT) * i, 0);
      ctx.lineTo((ROAD_WIDTH / LANE_COUNT) * i, canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw player car
    drawCar(ctx, playerRef.current);

    // Draw obstacles
    obstaclesRef.current.forEach(obs => {
      drawCar(ctx, obs);
    });
  }, []);

  const drawCar = (ctx: CanvasRenderingContext2D, car: Car | Obstacle) => {
    // Body
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(car.x, car.y, car.width, car.height, 8);
    ctx.fill();
    
    // Windshield
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(car.x + 5, car.y + 15, car.width - 10, 15);
    
    // Roof
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(car.x + 8, car.y + 35, car.width - 16, 20);

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(car.x + 5, car.y + 2, 8, 4);
    ctx.fillRect(car.x + car.width - 13, car.y + 2, 8, 4);
    
    // Tail lights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(car.x + 5, car.y + car.height - 6, 8, 4);
    ctx.fillRect(car.x + car.width - 13, car.y + car.height - 6, 8, 4);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  return (
    <div className="relative flex justify-center items-center bg-gray-900 p-4 rounded-xl shadow-2xl border-4 border-gray-700">
      <canvas
        ref={canvasRef}
        width={ROAD_WIDTH}
        height={600}
        className="rounded-lg shadow-inner"
      />
    </div>
  );
};
