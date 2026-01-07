import React, { useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
}

const ParticleBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { settings } = useStore();
    const particles = useRef<Particle[]>([]);
    const animationFrameId = useRef<number>(0);
    const mouse = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initParticles();
        };

        const initParticles = () => {
            particles.current = [];
            const particleCount = Math.floor((width * height) / 15000); // Density

            for (let i = 0; i < particleCount; i++) {
                particles.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                });
            }
        };

        const drawLine = (p1: Particle, p2: Particle, dist: number) => {
            const opacity = 1 - dist / 120;
            ctx.beginPath();
            ctx.strokeStyle = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                ? `rgba(253, 224, 71, ${opacity * 0.15})` // Amber-300 low opacity
                : `rgba(217, 119, 6, ${opacity * 0.15})`; // Amber-600 low opacity
            ctx.lineWidth = 1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Update and draw particles
            particles.current.forEach((p, i) => {
                // Movement
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Mouse interaction (Repulsion)
                const dx = mouse.current.x - p.x;
                const dy = mouse.current.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const repulsionRadius = 150;

                if (dist < repulsionRadius) {
                    const force = (repulsionRadius - dist) / repulsionRadius;
                    const angle = Math.atan2(dy, dx);
                    p.vx -= Math.cos(angle) * force * 0.5;
                    p.vy -= Math.sin(angle) * force * 0.5;
                }

                // Friction
                p.vx *= 0.99;
                p.vy *= 0.99;

                // Draw particle
                ctx.beginPath();
                ctx.fillStyle = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(0, 0, 0, 0.1)';
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Connect particles
                for (let j = i + 1; j < particles.current.length; j++) {
                    const p2 = particles.current[j];
                    const dx2 = p.x - p2.x;
                    const dy2 = p.y - p2.y;
                    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                    if (dist2 < 120) {
                        drawLine(p, p2, dist2);
                    }
                }
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);

        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId.current);
        };
    }, [settings.theme]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
        />
    );
};

export default ParticleBackground;
