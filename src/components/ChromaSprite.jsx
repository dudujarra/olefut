import React, { useEffect, useRef, useState } from 'react';

export default function ChromaSprite({ 
    src, 
    actionRow = 0, 
    frames = 6, 
    fps = 10,
    direction = 'right',
    scale = 1,
    tolerance = 30
}) {
    const canvasRef = useRef(null);
    const [processedCanvas, setProcessedCanvas] = useState(null);
    const [spriteMetrics, setSpriteMetrics] = useState({ w: 0, h: 0 });
    const frameRef = useRef(0);
    const reqRef = useRef(null);

    // Load and pre-process image once
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;
        img.onload = () => {
            const offscreen = document.createElement('canvas');
            offscreen.width = img.width;
            offscreen.height = img.height;
            const offCtx = offscreen.getContext('2d');
            offCtx.drawImage(img, 0, 0);

            try {
                const imgData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
                const data = imgData.data;

                // Get background color from the top-left pixel
                const bgR = data[0];
                const bgG = data[1];
                const bgB = data[2];

                // Chroma key
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];

                    // If color matches background within tolerance, or it's a grid line (very dark)
                    const isBg = Math.abs(r - bgR) < tolerance && Math.abs(g - bgG) < tolerance && Math.abs(b - bgB) < tolerance;
                    const isGrid = r < 20 && g < 20 && b < 20;

                    if (isBg || isGrid) {
                        data[i+3] = 0; // Set alpha to 0
                    }
                }
                offCtx.putImageData(imgData, 0, 0);
                setProcessedCanvas(offscreen);

                const spriteW = img.width / frames;
                const numRows = Math.round(img.height / spriteW); 
                const spriteH = img.height / (numRows > 0 ? numRows : 8);
                setSpriteMetrics({ w: spriteW, h: spriteH });
            } catch (e) {
                console.error("Canvas CORS or data error:", e);
                // Fallback to original image if processing fails
                setProcessedCanvas(img);
                const spriteW = img.width / frames;
                const numRows = Math.round(img.height / spriteW); 
                const spriteH = img.height / (numRows > 0 ? numRows : 8);
                setSpriteMetrics({ w: spriteW, h: spriteH });
            }
        };
    }, [src, frames, tolerance]);

    // Animate the pre-processed canvas
    useEffect(() => {
        if (!processedCanvas || !canvasRef.current || spriteMetrics.w === 0) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const { w: spriteW, h: spriteH } = spriteMetrics;
        canvas.width = spriteW;
        canvas.height = spriteH;

        let lastTime = 0;
        const frameInterval = 1000 / fps;

        const animate = (time) => {
            reqRef.current = requestAnimationFrame(animate);

            if (time - lastTime < frameInterval) return;
            lastTime = time;

            ctx.clearRect(0, 0, spriteW, spriteH);

            const sx = frameRef.current * spriteW;
            const sy = actionRow * spriteH;

            ctx.save();
            if (direction === 'left') {
                ctx.scale(-1, 1);
                ctx.drawImage(processedCanvas, sx, sy, spriteW, spriteH, -spriteW, 0, spriteW, spriteH);
            } else {
                ctx.drawImage(processedCanvas, sx, sy, spriteW, spriteH, 0, 0, spriteW, spriteH);
            }
            ctx.restore();

            frameRef.current = (frameRef.current + 1) % frames;
        };

        reqRef.current = requestAnimationFrame(animate);

        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, [processedCanvas, actionRow, frames, fps, direction, spriteMetrics]);

    return (
        <canvas 
            ref={canvasRef} 
            className="ef-chroma-sprite"
            style={{ 
                '--sprite-scale': scale
            }} 
        />
    );
}
