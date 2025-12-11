
import React, { useEffect, useRef } from 'react';

interface FishProps {
  fishCount?: number;
  maxSpeed?: number;
  perceptionRadius?: number;
  separationStrength?: number;
  seekStrength?: number;
  wanderStrength?: number;
}

// 向量辅助类
class Vector {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(v: Vector) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vector) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n: number) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n: number) {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  limit(max: number) {
    if (this.mag() > max) {
      this.normalize();
      this.mult(max);
    }
    return this;
  }

  heading() {
    return Math.atan2(this.y, this.x);
  }

  static sub(v1: Vector, v2: Vector) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }

  copy() {
    return new Vector(this.x, this.y);
  }
}

class Fish {
  pos: Vector;
  vel: Vector;
  acc: Vector;
  maxSpeed: number;
  maxForce: number;
  wobble: number;
  size: number;
  color: string;
  angle: number;

  // 状态追踪
  lastTargetId: number;
  isArrived: boolean;

  constructor(x: number, y: number, maxSpeed: number, color: string) {
    this.pos = new Vector(x, y);
    this.vel = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
    this.acc = new Vector(0, 0);
    this.maxSpeed = maxSpeed * (0.8 + Math.random() * 0.4);
    this.maxForce = 0.1;
    this.wobble = Math.random() * Math.PI * 2;
    this.size = 20 + Math.random() * 5;
    this.angle = 0;
    this.color = color;
    
    // 初始化状态
    this.lastTargetId = 0;
    this.isArrived = true; // 初始状态为漫游，直到有新目标
  }

  applyForce(force: Vector) {
    this.acc.add(force);
  }

  seek(target: Vector, strength: number, arriveRadius: number = 150) {
    const desired = Vector.sub(target, this.pos);
    const d = desired.mag();

    let speed = this.maxSpeed;
    // 只有当 arriveRadius > 0 时才启用减速逻辑
    // 如果传入 0，则保持全速，实现“穿过”效果
    if (arriveRadius > 0 && d < arriveRadius) {
      speed = (d / arriveRadius) * this.maxSpeed;
    }

    desired.normalize();
    desired.mult(speed);

    const steer = Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    steer.mult(strength);
    this.applyForce(steer);
  }

  separate(fishes: Fish[], perceptionRadius: number, strength: number) {
    const steering = new Vector(0, 0);
    let total = 0;

    for (const other of fishes) {
      const d = Math.hypot(this.pos.x - other.pos.x, this.pos.y - other.pos.y);
      if (other !== this && d < perceptionRadius) {
        const diff = Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d);
        steering.add(diff);
        total++;
      }
    }

    if (total > 0) {
      steering.div(total);
      steering.normalize();
      steering.mult(this.maxSpeed);
      steering.sub(this.vel);
      steering.limit(this.maxForce * 2);
      steering.mult(strength);
      this.applyForce(steering);
    }
  }

  wander(strength: number) {
    const wanderR = 25;
    const wanderD = 80;
    const change = 0.3;
    this.wobble += Math.random() * change * 2 - change;
    
    const circlePos = this.vel.copy();
    circlePos.normalize();
    circlePos.mult(wanderD);
    circlePos.add(this.pos);

    const h = this.vel.heading();
    const circleOffset = new Vector(
      wanderR * Math.cos(this.wobble + h),
      wanderR * Math.sin(this.wobble + h)
    );
    
    const target = circlePos.add(circleOffset);
    this.seek(target, strength, 0);
  }

  boundaries(width: number, height: number) {
    const margin = 50;
    const force = new Vector(0, 0);
    const maxSpeed = this.maxSpeed;

    if (this.pos.x < margin) force.x = maxSpeed;
    else if (this.pos.x > width - margin) force.x = -maxSpeed;

    if (this.pos.y < margin) force.y = maxSpeed;
    else if (this.pos.y > height - margin) force.y = -maxSpeed;

    if (force.x !== 0 || force.y !== 0) {
      force.normalize();
      force.mult(maxSpeed);
      const steer = Vector.sub(force, this.vel);
      steer.limit(this.maxForce);
      this.applyForce(steer);
    }
  }

  update(deltaTime: number) {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.wobble += 0.05;
    this.angle = this.vel.heading();
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Scale factor to adjust the overall size of the new shape
    const s = this.size * 0.6;

    // 1. Tail (Thin filament)
    // Extending far back to look like the reference
    ctx.beginPath();
    ctx.moveTo(-s * 2.8, 0); 
    ctx.lineTo(-s * 6.0, 0);
    ctx.stroke();

    // 2. Body (Elongated oval)
    ctx.beginPath();
    // Center (0,0), long axis radius ~3.2s, short axis radius ~1.0s
    ctx.ellipse(0, 0, s * 3.2, s * 1.0, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Pectoral Fins (Large front fins)
    // Upper Fin (+y in rotated space)
    ctx.beginPath();
    ctx.moveTo(s * 1.2, s * 0.5); 
    ctx.quadraticCurveTo(s * 0.5, s * 2.8, -s * 0.8, s * 0.8);
    ctx.fill();
    
    // Lower Fin (-y)
    ctx.beginPath();
    ctx.moveTo(s * 1.2, -s * 0.5); 
    ctx.quadraticCurveTo(s * 0.5, -s * 2.8, -s * 0.8, -s * 0.8);
    ctx.fill();

    // 4. Pelvic/Rear Fins (Small back fins)
    // Upper
    ctx.beginPath();
    ctx.moveTo(-s * 1.0, s * 0.5);
    ctx.quadraticCurveTo(-s * 1.5, s * 1.5, -s * 2.2, s * 0.4);
    ctx.fill();

    // Lower
    ctx.beginPath();
    ctx.moveTo(-s * 1.0, -s * 0.5);
    ctx.quadraticCurveTo(-s * 1.5, -s * 1.5, -s * 2.2, -s * 0.4);
    ctx.fill();

    ctx.restore();
  }
}

// 7 Bright Colors
const COLORS = [
    '#FF6B6B', // Red
    '#FF9F43', // Orange
    '#FDCB6E', // Yellow
    '#55EFC4', // Green/Teal
    '#00CEC9', // Cyan
    '#0984E3', // Blue
    '#FD79A8', // Pink
];

interface TargetData {
    pos: Vector;
    id: number;
}

const FishBackground: React.FC<FishProps> = ({
  fishCount = 7,
  maxSpeed = 2.5,
  perceptionRadius = 50, // Reduced from 80 to allow closer proximity
  separationStrength = 0.1, // Significantly reduced from 1.8 to allow overlapping
  seekStrength = 1.2,
  wanderStrength = 0.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fishesRef = useRef<Fish[]>([]);
  // Store target position AND a unique ID to detect "new" moves
  const targetRef = useRef<TargetData | null>(null);
  const targetIdCounter = useRef(0);
  
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isReducedMotion = useRef(false);

  useEffect(() => {
    try {
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            isReducedMotion.current = mediaQuery.matches;
            
            const handleMotionChange = (e: MediaQueryListEvent) => {
              isReducedMotion.current = e.matches;
            };
            mediaQuery.addEventListener('change', handleMotionChange);
            
            return () => mediaQuery.removeEventListener('change', handleMotionChange);
        }
    } catch (e) {
        isReducedMotion.current = false;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const initFishes = (width: number, height: number) => {
      fishesRef.current = [];
      const actualCount = isReducedMotion.current ? 2 : fishCount;
      const actualSpeed = isReducedMotion.current ? maxSpeed * 0.2 : maxSpeed;

      for (let i = 0; i < actualCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const color = COLORS[i % COLORS.length];
        fishesRef.current.push(new Fish(x, y, actualSpeed, color));
      }
    };

    const handleResize = () => {
      if (containerRef.current && canvas) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width === 0 || height === 0) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
        
        if (fishesRef.current.length === 0) {
          initFishes(width, height);
        }
      }
    };

    handleResize();

    const handleMouseMove = (e: MouseEvent) => {
      if (isReducedMotion.current || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      targetIdCounter.current += 1; // Increment ID on move to signal a new target intent
      targetRef.current = {
          pos: new Vector(e.clientX - rect.left, e.clientY - rect.top),
          id: targetIdCounter.current
      };
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        if (isReducedMotion.current || !canvas) return;
        if(e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            targetIdCounter.current += 1;
            targetRef.current = {
                pos: new Vector(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top),
                id: targetIdCounter.current
            };
        }
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    const render = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current; 
      lastTimeRef.current = time;

      const safeDelta = Math.min(deltaTime, 64);

      if (containerRef.current && ctx) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          ctx.clearRect(0, 0, width, height);

          for (const fish of fishesRef.current) {
            fish.boundaries(width, height);
            fish.separate(fishesRef.current, perceptionRadius, separationStrength);

            let shouldSeek = false;

            if (targetRef.current && !isReducedMotion.current) {
                const target = targetRef.current;
                
                // 如果发现目标 ID 变了（鼠标移动了），则重置“已到达”状态，开始新的追踪
                if (fish.lastTargetId !== target.id) {
                    fish.isArrived = false;
                    fish.lastTargetId = target.id;
                }

                if (!fish.isArrived) {
                    const dist = Vector.sub(target.pos, fish.pos).mag();
                    // 距离阈值：30px。
                    // 当距离小于这个值，视为“穿过”了目标，标记为到达，然后切换为漫游。
                    if (dist < 30) {
                        fish.isArrived = true;
                    } else {
                        shouldSeek = true;
                        // arriveRadius = 0 表示全速冲向目标，不减速，实现“穿过”效果
                        fish.seek(target.pos, seekStrength, 0);
                    }
                }
            }

            // 如果不处于追踪状态（已到达，或没有目标，或减弱动画模式），则完全随机漫游
            if (!shouldSeek) {
              fish.wander(wanderStrength);
            }

            fish.update(safeDelta);
            fish.draw(ctx);
          }
      }

      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameIdRef.current);
      } else {
        lastTimeRef.current = 0;
        frameIdRef.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(frameIdRef.current);
    };
  }, [fishCount, maxSpeed, perceptionRadius, separationStrength, seekStrength, wanderStrength]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }} 
    >
      <canvas ref={canvasRef} className="block w-full h-full opacity-60" /> 
    </div>
  );
};

export default FishBackground;
