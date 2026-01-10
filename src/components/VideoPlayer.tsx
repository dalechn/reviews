 "use client";

import { useState, useRef, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export default function VideoPlayer({ src, className = "" }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const playerRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = playerRef.current;
    if (!video) return;
    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch((err) => {
          console.warn("Video play failed:", err);
          setIsPlaying(false);
        });
      }
    } else {
      video.pause();
    }
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (isEnded) {
      // 如果视频已结束，重新播放（跳到开头并播放）
      setIsEnded(false);
      setIsPlaying(true);
      if (playerRef.current) {
        try {
          playerRef.current.currentTime = 0;
          const playPromise = playerRef.current.play();
          if (playPromise && typeof playPromise.then === "function") {
            playPromise.catch((err) => {
              console.warn("Play after restart failed:", err);
              setIsPlaying(false);
            });
          }
        } catch (err) {
          console.warn("Error resetting video time:", err);
        }
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handlePlayerError = (error: any) => {
    console.error("Video player error:", error);
  };

  const handleEnded = () => {
    setIsEnded(true);
    setIsPlaying(false);
    // 确保显示最后一帧 - 将 currentTime 设置到接近结束的位置
    const video = playerRef.current;
    if (video && video.duration) {
      try {
        video.currentTime = Math.max(0, video.duration - 0.1);
        video.pause();
      } catch (err) {
        console.warn("Error setting last frame time:", err);
      }
    }
  };

  return (
    <div className={`relative w-full h-full bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={playerRef}
        src={src}
        playsInline
        controls={false}
        onError={(e) => handlePlayerError(e)}
        onEnded={handleEnded}
        preload="metadata"
        style={{ width: "100%", height: "100%", objectFit: "cover", margin: 0, padding: 0 }}
        controlsList="nodownload"
      />

      <div
        className="absolute inset-0 flex items-center justify-center bg-transparent group"
        onClick={handlePlayPause}
      >
        <button
          className={`w-16 h-16 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-all duration-200 transform hover:scale-110 cursor-pointer ${
            isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPause();
          }}
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : isEnded ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}


