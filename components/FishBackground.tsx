
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

  constructor(x: number, y: number, maxSpeed: number, color: string) {
    this.pos = new Vector(x, y);
    this.vel = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
    this.acc = new Vector(0, 0);
    this.maxSpeed = maxSpeed * (0.8 + Math.random() * 0.4);
    this.maxForce = 0.1;
    this.wobble = Math.random() * Math.PI * 2;
    this.size = 24 + Math.random() * 16;
    this.angle = 0;
    this.color = color;
  }

  applyForce(force: Vector) {
    this.acc.add(force);
  }

  seek(target: Vector, strength: number, arriveRadius: number = 150) {
    const desired = Vector.sub(target, this.pos);
    const d = desired.mag();

    let speed = this.maxSpeed;
    if (d < arriveRadius) {
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
    
    // 身体：变得更细长
    // X轴半径加大 (1.2倍 size)，Y轴半径减小 (0.25倍 size)
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 1.2, this.size / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 尾巴：配合身体调整位置
    // 向后移动起始点
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.8, 0); 
    ctx.lineTo(-this.size * 1.4, -this.size / 3);
    ctx.lineTo(-this.size * 1.4, this.size / 3);
    ctx.fill();

    // 眼睛：稍微调整位置
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(this.size * 0.6, -this.size / 10, this.size / 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98FB98', '#DDA0DD'];

const FishBackground: React.FC<FishProps> = ({
  fishCount = 8,
  maxSpeed = 2.5,
  perceptionRadius = 80,
  separationStrength = 1.8,
  seekStrength = 1.2,
  wanderStrength = 0.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fishesRef = useRef<Fish[]>([]);
  const targetRef = useRef<Vector | null>(null);
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isReducedMotion = useRef(false);
  
  // 用于检测鼠标是否停止
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      targetRef.current = new Vector(e.clientX - rect.left, e.clientY - rect.top);

      // 清除之前的定时器
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }

      // 设置新的定时器，如果 200ms 内没有新的移动事件，视为鼠标停止
      mouseTimeoutRef.current = setTimeout(() => {
        targetRef.current = null; // 停止跟随
      }, 200);
    };
    
    // 触摸同理
    const handleTouchMove = (e: TouchEvent) => {
        if (isReducedMotion.current || !canvas) return;
        if(e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            targetRef.current = new Vector(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
            
            if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
            mouseTimeoutRef.current = setTimeout(() => {
                targetRef.current = null;
            }, 200);
        }
    }
    
    const handleMouseLeave = () => {
       targetRef.current = null;
       if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseLeave);
    window.addEventListener('mouseout', handleMouseLeave);

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

            // 逻辑更新：
            // 1. 只有 target 存在（鼠标在移动）时才 seek
            // 2. 如果鱼距离 target 太近（已到达），则强制 wander，避免原地转圈
            let isSeeking = false;
            
            if (targetRef.current && !isReducedMotion.current) {
                const dist = Vector.sub(targetRef.current, fish.pos).mag();
                // 距离阈值：50px。如果小于这个距离，视为到达，继续漫游穿过
                if (dist > 50) {
                   fish.seek(targetRef.current, seekStrength);
                   isSeeking = true;
                }
            }
            
            if (!isSeeking) {
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
      window.removeEventListener('touchend', handleMouseLeave);
      window.removeEventListener('mouseout', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(frameIdRef.current);
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
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
