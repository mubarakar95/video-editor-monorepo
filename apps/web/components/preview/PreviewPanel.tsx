"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTimelineStore, useMediaStore } from "@/stores";
import TransportControls from "./TransportControls";

export default function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const playbackRef = useRef<number>();
  const lastClipIdRef = useRef<string | null>(null);
  const videoReadyRef = useRef<boolean>(false);
  const lastVideoUrlRef = useRef<string | null>(null);

  const { timeline, currentTime, isPlaying, setIsPlaying, setCurrentTime } =
    useTimelineStore();
  const { getAsset } = useMediaStore();

  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingState, setLoadingState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  // Calculate duration from tracks
  const timelineDuration = timeline
    ? Math.max(
        ...timeline.tracks.map((track) =>
          track.clips.reduce(
            (max, clip) =>
              Math.max(
                max,
                clip.timelineRange.start.value /
                  (clip.timelineRange.start.rate || 30) +
                  clip.timelineRange.duration.value /
                    (clip.timelineRange.duration.rate || 30),
              ),
            0,
          ),
        ),
      )
    : 0;

  // Get media URL from store
  const getMediaUrl = useCallback(
    (sourceId: string): string | null => {
      const asset = getAsset(sourceId);
      return asset?.url || null;
    },
    [getAsset],
  );

  // Handle video loading events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      videoReadyRef.current = true;
      setLoadingState("ready");
      console.log("Video ready to play");
    };

    const handleWaiting = () => {
      setLoadingState("loading");
    };

    const handleLoadedData = () => {
      console.log("Video data loaded:", {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    const handleError = (e: Event) => {
      const videoEl = e.target as HTMLVideoElement;
      const error = videoEl.error;
      console.error("Video error:", {
        code: error?.code,
        message: error?.message,
        src: videoEl.src?.substring(0, 50),
      });
      videoReadyRef.current = false;
      setLoadingState("error");
    };

    const handleLoadStart = () => {
      setLoadingState("loading");
      videoReadyRef.current = false;
      console.log("Video load started");
    };

    const handleProgress = () => {
      // Video is buffering
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("progress", handleProgress);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("progress", handleProgress);
    };
  }, []);

  // Main Render Loop
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const video = videoRef.current;

      if (!canvas || !ctx) return;

      // Access fresh state directly to avoid dependency issues in loop
      const state = useTimelineStore.getState();
      const currentTimeline = state.timeline;
      const time = state.currentTime;
      const playing = state.isPlaying;

      // Clear canvas
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!currentTimeline || currentTimeline.tracks.length === 0) {
        ctx.fillStyle = "#3a3a4e";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "No project loaded",
          canvas.width / 2,
          canvas.height / 2 - 10,
        );
        ctx.font = "12px sans-serif";
        ctx.fillText(
          "Drag media to timeline to begin",
          canvas.width / 2,
          canvas.height / 2 + 10,
        );
        requestRef.current = requestAnimationFrame(render);
        return;
      }

      // Find active clip
      let activeClip: (typeof currentTimeline.tracks)[0]["clips"][0] | null =
        null;

      for (const track of currentTimeline.tracks) {
        if (track.kind !== "video") continue;

        const clip = track.clips.find((c) => {
          const start =
            c.timelineRange.start.value / (c.timelineRange.start.rate || 30);
          const duration =
            c.timelineRange.duration.value /
            (c.timelineRange.duration.rate || 30);
          return time >= start && time < start + duration;
        });

        if (clip) {
          activeClip = clip;
          break;
        }
      }

      if (activeClip && video) {
        // Calculate video time from clip position
        const clipStart =
          activeClip.timelineRange.start.value /
          (activeClip.timelineRange.start.rate || 30);
        const sourceStart =
          activeClip.sourceRange.start.value /
          (activeClip.sourceRange.start.rate || 30);
        const videoTime = time - clipStart + sourceStart;

        const mediaUrl = getMediaUrl(activeClip.sourceId);

        // Handle clip change - load new video if needed
        if (mediaUrl && mediaUrl !== lastVideoUrlRef.current) {
          lastClipIdRef.current = activeClip.id;
          lastVideoUrlRef.current = mediaUrl;
          videoReadyRef.current = false;

          // For blob URLs, don't use crossOrigin
          if (mediaUrl.startsWith("blob:")) {
            video.removeAttribute("crossOrigin");
          } else {
            video.setAttribute("crossOrigin", "anonymous");
          }

          video.src = mediaUrl;
          video.load();
          setLoadingState("loading");
          console.log("Loading video:", mediaUrl.substring(0, 50));
        }

        if (!mediaUrl) {
          setLoadingState("error");
          ctx.fillStyle = "#ff4444";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Media not found", canvas.width / 2, canvas.height / 2);
          requestRef.current = requestAnimationFrame(render);
          return;
        }

        // Sync video time if significantly drifted
        if (
          videoReadyRef.current &&
          Math.abs(video.currentTime - videoTime) > 0.2
        ) {
          video.currentTime = videoTime;
        }

        // Handle Play/Pause
        if (playing && video.paused && videoReadyRef.current) {
          video.play().catch((error) => {
            console.warn("Auto-play prevented:", error);
          });
        } else if (!playing && !video.paused) {
          video.pause();
        }

        // Draw frame if ready
        if (video.readyState >= 2 && videoReadyRef.current) {
          // Maintain aspect ratio
          const videoAspect = video.videoWidth / video.videoHeight;
          const canvasAspect = canvas.width / canvas.height;

          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let offsetX = 0;
          let offsetY = 0;

          if (videoAspect > canvasAspect) {
            drawHeight = canvas.width / videoAspect;
            offsetY = (canvas.height - drawHeight) / 2;
          } else {
            drawWidth = canvas.height * videoAspect;
            offsetX = (canvas.width - drawWidth) / 2;
          }

          ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        } else {
          // Loading indicator
          ctx.fillStyle = "#1a1a2e";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";

          if (loadingState === "error") {
            ctx.fillStyle = "#ff4444";
            ctx.fillText(
              "Error loading video",
              canvas.width / 2,
              canvas.height / 2,
            );
          } else {
            ctx.fillText(
              "Loading video...",
              canvas.width / 2,
              canvas.height / 2,
            );
          }
        }
      } else {
        // No active clip found - stop video and show placeholder
        if (video && !video.paused) {
          video.pause();
        }
        lastClipIdRef.current = null;

        ctx.fillStyle = "#1a1a2e";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `Time: ${time.toFixed(2)}s`,
          canvas.width / 2,
          canvas.height / 2,
        );
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [getMediaUrl, loadingState, timelineDuration]);

  // Handle Playback Clock
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();

    const animate = (timestamp: number) => {
      const delta = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      const state = useTimelineStore.getState();
      const currentT = state.currentTime;
      const maxDuration = timelineDuration > 0 ? timelineDuration + 1 : 300;

      if (currentT < maxDuration) {
        setCurrentTime(currentT + delta);
        playbackRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    playbackRef.current = requestAnimationFrame(animate);
    return () => {
      if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
    };
  }, [isPlaying, setCurrentTime, setIsPlaying, timelineDuration]);

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) videoRef.current.volume = newVolume;
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-dark-950">
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={1280}
          height={720}
          style={{ objectFit: "contain" }}
        />
        {/* Hidden video element for decoding */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted={true}
          preload="auto"
        />

        <div className="absolute top-2 right-2 flex gap-2">
          {loadingState === "loading" && (
            <div className="px-2 py-1 bg-dark-800 bg-opacity-70 rounded text-xs text-dark-300 flex items-center gap-1">
              <svg
                className="w-3 h-3 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              Loading
            </div>
          )}
          <button
            onClick={handleFullscreen}
            className="p-2 bg-dark-800 bg-opacity-70 rounded text-dark-300 hover:text-white"
            title="Fullscreen"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="border-t border-dark-700 bg-dark-800 px-4 py-2">
        <TransportControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={timelineDuration}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={handleVolumeChange}
        />
      </div>
    </div>
  );
}
