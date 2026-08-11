import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import './AnimationPreview.css';

interface AnimationPreviewProps {
  generatedImageUrl: string;
  totalFrames: number;
  frameWidth: number;
  frameHeight: number;
  columns: number;
}

export function AnimationPreview({ 
  generatedImageUrl, 
  totalFrames, 
  frameWidth, 
  frameHeight,
  columns
}: AnimationPreviewProps) {
  const [fps, setFps] = useState<number>(12);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || frameWidth <= 0 || frameHeight <= 0 || columns <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, frameWidth, frameHeight);

    // Calculate source rectangle from the 2D grid generated sprite sheet
    const column = frameIndex % columns;
    const row = Math.floor(frameIndex / columns);
    const sourceX = column * frameWidth;
    const sourceY = row * frameHeight;
    
    ctx.drawImage(
      img,
      sourceX, sourceY, frameWidth, frameHeight,
      0, 0, frameWidth, frameHeight
    );
  }, [frameWidth, frameHeight, columns]);

  // Load the generated sprite sheet
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      renderFrame(currentFrame);
    };
    img.src = generatedImageUrl;
    return () => {
      imageRef.current = null;
    };
  }, [generatedImageUrl, currentFrame, renderFrame]); // Added missing dependencies

  // Handle animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (time: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = time;
      }

      const elapsed = time - lastFrameTimeRef.current;
      const frameDuration = 1000 / fps;

      if (elapsed >= frameDuration) {
        setCurrentFrame(prev => {
          const next = prev + 1;
          if (next >= totalFrames) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return next;
        });
        
        lastFrameTimeRef.current = time - (elapsed % frameDuration);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, fps, isLooping, totalFrames]);

  // Render the current frame when it changes
  useEffect(() => {
    renderFrame(currentFrame);
  }, [currentFrame, renderFrame]);

  const handleFpsChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 12;
    if (val < 1) val = 1;
    if (val > 60) val = 60;
    setFps(val);
  };

  const togglePlay = () => {
    if (!isPlaying && currentFrame >= totalFrames - 1 && !isLooping) {
      setCurrentFrame(0);
    }
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      lastFrameTimeRef.current = 0;
    }
  };

  const nextFrame = () => {
    setIsPlaying(false);
    setCurrentFrame(prev => (prev + 1) % totalFrames);
  };

  const prevFrame = () => {
    setIsPlaying(false);
    setCurrentFrame(prev => (prev - 1 + totalFrames) % totalFrames);
  };

  if (totalFrames <= 0 || frameWidth <= 0 || frameHeight <= 0) return null;

  return (
    <div className="animation-preview-container">
      <div className="animation-header">
        <h3 className="animation-title">Animation Preview</h3>
        <span className="frame-counter">Frame {currentFrame + 1} / {totalFrames}</span>
      </div>

      <div className="canvas-wrapper">
        <canvas 
          ref={canvasRef}
          width={frameWidth}
          height={frameHeight}
          className="animation-canvas"
        />
      </div>

      <div className="animation-controls">
        <button 
          className={`control-btn ${isPlaying ? 'play-btn' : ''}`}
          onClick={togglePlay}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>

        <button className="control-btn" onClick={prevFrame} title="Previous Frame">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20"></polygon>
            <line x1="5" y1="19" x2="5" y2="5"></line>
          </svg>
        </button>

        <button className="control-btn" onClick={nextFrame} title="Next Frame">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4"></polygon>
            <line x1="19" y1="5" x2="19" y2="19"></line>
          </svg>
        </button>

        <div className="control-group" style={{ marginLeft: 'auto' }}>
          <label className="loop-toggle">
            <input 
              type="checkbox" 
              checked={isLooping} 
              onChange={(e) => setIsLooping(e.target.checked)} 
            />
            Loop
          </label>
        </div>

        <div className="control-group">
          <label className="control-label">FPS:</label>
          <input 
            type="number" 
            className="fps-input" 
            value={fps} 
            onChange={handleFpsChange}
            min={1}
            max={60}
          />
        </div>
      </div>
    </div>
  );
}
