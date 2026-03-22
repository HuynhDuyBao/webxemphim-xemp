import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, Settings, Subtitles } from 'lucide-react';
import Hls from 'hls.js';
import { subtitleService } from '../api/subtitleService';
import './VideoPlayer.css';

const VideoPlayer = ({ url, poster, onProgress, onEnded, startTime = 0, videoUid = null }) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [hasSeekedToStart, setHasSeekedToStart] = useState(false);
  
  // Quality State
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 is Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Subtitle State
  const [availableSubtitles, setAvailableSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('off');
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Load subtitles and create blob URLs
  useEffect(() => {
    const loadSubtitles = async () => {
      if (videoUid) {
        try {
          const subs = await subtitleService.getSubtitles(videoUid);
          const readySubs = subs.filter(s => s.status === 'ready');
          
          // Load subtitle content and create blob URLs
          const subsWithUrls = await Promise.all(
            readySubs.map(async (sub) => {
              try {
                const content = await subtitleService.getSubtitleFile(videoUid, sub.language);
                const blob = new Blob([content], { type: 'text/vtt' });
                const blobUrl = URL.createObjectURL(blob);
                return { ...sub, blobUrl };
              } catch (err) {
                console.error(`Failed to load subtitle ${sub.language}:`, err);
                return null;
              }
            })
          );
          
          setAvailableSubtitles(subsWithUrls.filter(s => s !== null));
        } catch (err) {
          console.error('Failed to load subtitles:', err);
          setAvailableSubtitles([]);
        }
      }
    };
    loadSubtitles();
    
    // Cleanup blob URLs on unmount
    return () => {
      availableSubtitles.forEach(sub => {
        if (sub.blobUrl) {
          URL.revokeObjectURL(sub.blobUrl);
        }
      });
    };
  }, [videoUid]);

  const handleSubtitleChange = (languageCode) => {
    const video = videoRef.current;
    if (!video) return;

    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = 'disabled';
    }

    if (languageCode !== 'off') {
      for (let i = 0; i < video.textTracks.length; i++) {
        if (video.textTracks[i].language === languageCode) {
          video.textTracks[i].mode = 'showing';
          break;
        }
      }
    }

    setCurrentSubtitle(languageCode);
    setShowSubtitleMenu(false);
  };

  // Auto-enable Vietnamese subtitle by default
  useEffect(() => {
    const video = videoRef.current;
    if (!video || availableSubtitles.length === 0) return;

    // Wait for tracks to be loaded
    const timer = setTimeout(() => {
      const viTrack = Array.from(video.textTracks).find(track => track.language === 'vi');
      if (viTrack) {
        viTrack.mode = 'showing';
        setCurrentSubtitle('vi');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [availableSubtitles]);

  // Initialize Player (HLS or Native)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    const isHls = url.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        // Get available qualities
        const levels = hls.levels.map((level, index) => ({
            index,
            height: level.height,
            bitrate: level.bitrate
        }));
        // Sort by height (descending)
        levels.sort((a, b) => b.height - a.height);
        setQualities(levels);

        if (startTime > 0 && !hasSeekedToStart) {
            video.currentTime = startTime;
            setHasSeekedToStart(true);
            video.play().catch(() => setPlaying(false));
            setPlaying(true);
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
         // Optional: Update UI to show current auto-selected level if needed
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS Error:", data);
          if (data.fatal) {
              switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                      hls.startLoad();
                      break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                      hls.recoverMediaError();
                      break;
                  default:
                      hls.destroy();
                      break;
              }
          }
      });
    } else {
      // Native HLS (Safari) or MP4
      video.src = url;
      if (startTime > 0 && !hasSeekedToStart) {
          video.currentTime = startTime;
          setHasSeekedToStart(true);
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [url]);

  // Handle Quality Change
  const handleQualityChange = (levelIndex) => {
      if (hlsRef.current) {
          hlsRef.current.currentLevel = levelIndex;
          setCurrentQuality(levelIndex);
          setShowQualityMenu(false);
      }
  };

  // Handle Video Events
  useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const onPlay = () => setPlaying(true);
      const onPause = () => setPlaying(false);
      const onWaiting = () => setBuffering(true);
      const onPlaying = () => setBuffering(false);
      const onTimeUpdate = () => {
          setCurrentTime(video.currentTime);
          if (onProgress) onProgress(video.currentTime);
      };
      const onLoadedMetadata = () => setDuration(video.duration);
      const onEndedHandler = () => {
          setPlaying(false);
          if (onEnded) onEnded();
      };

      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('waiting', onWaiting);
      video.addEventListener('playing', onPlaying);
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('ended', onEndedHandler);

      return () => {
          video.removeEventListener('play', onPlay);
          video.removeEventListener('pause', onPause);
          video.removeEventListener('waiting', onWaiting);
          video.removeEventListener('playing', onPlaying);
          video.removeEventListener('timeupdate', onTimeUpdate);
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('ended', onEndedHandler);
      };
  }, [onProgress, onEnded]);

  // Sync Volume/Mute
  useEffect(() => {
      if (videoRef.current) {
          videoRef.current.volume = volume;
          videoRef.current.muted = muted;
      }
  }, [volume, muted]);

  // Sync Play/Pause from State
  useEffect(() => {
      if (videoRef.current) {
          if (playing && videoRef.current.paused) {
              videoRef.current.play().catch(() => setPlaying(false));
          } else if (!playing && !videoRef.current.paused) {
              videoRef.current.pause();
          }
      }
  }, [playing]);


  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleSeekChange = (e) => {
    setSeeking(true);
    const newTime = parseFloat(e.target.value) * duration;
    setCurrentTime(newTime);
    if (videoRef.current) {
        videoRef.current.currentTime = newTime;
    }
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    // Final seek is already done in onChange, just ensure state is consistent
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div 
      ref={wrapperRef} 
      className={`video-player-wrapper ${!showControls && playing ? 'hide-cursor' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="react-player"
        width="100%"
        height="100%"
        poster={poster}
        crossOrigin="anonymous"
        playsInline
        onClick={handlePlayPause}
      >
        {availableSubtitles.map((sub) => (
          <track
            key={sub.language}
            kind="subtitles"
            src={sub.blobUrl}
            srcLang={sub.language}
            label={sub.label}
            default={sub.language === 'vi'}
          />
        ))}
      </video>

      {/* Overlay Gradient */}
      <div className={`vp-overlay ${showControls ? 'visible' : ''}`}></div>

      {/* Center Controls (Play/Pause/Buffering) */}
      <div className="vp-center-controls">
        {buffering ? (
          <div className="vp-spinner"></div>
        ) : (
          !playing && (
            <button className="vp-center-play" onClick={handlePlayPause}>
              <Play size={32} fill="white" className="ml-1" />
            </button>
          )
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className={`vp-controls-bar ${showControls || !playing ? 'visible' : ''}`}>
        
        {/* Progress Bar */}
        <div className="vp-progress-container">
          <input
            type="range"
            min={0}
            max={1}
            step="any"
            value={progress}
            onMouseDown={() => setSeeking(true)}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
            className="absolute w-full h-full opacity-0 cursor-pointer z-20"
            style={{position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 20}}
          />
          <div className="vp-progress-bg">
            <div 
              className="vp-progress-filled" 
              style={{ width: `${progress * 100}%` }}
            >
              <div className="vp-progress-thumb"></div>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="vp-controls-row">
          <div className="vp-controls-left">
            <button className="vp-btn" onClick={handlePlayPause}>
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <div className="vp-volume-container">
              <button className="vp-btn" onClick={() => setMuted(!muted)}>
                {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step="any"
                value={muted ? 0 : volume}
                onChange={e => {
                  setVolume(parseFloat(e.target.value));
                  setMuted(false);
                }}
                className="vp-volume-slider"
              />
            </div>

            <span className="vp-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="vp-controls-right">
            {/* Subtitle Selector */}
            {availableSubtitles.length > 0 && (
                <div className="vp-quality-container">
                    <button 
                        className="vp-btn" 
                        onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                        title="Phụ đề"
                    >
                        <Subtitles size={20} />
                    </button>
                    <div className={`vp-quality-menu ${showSubtitleMenu ? 'visible' : ''}`}>
                        <button 
                            className={`vp-quality-item ${currentSubtitle === 'off' ? 'active' : ''}`}
                            onClick={() => handleSubtitleChange('off')}
                        >
                            Tắt phụ đề
                        </button>
                        {availableSubtitles.map((sub) => (
                            <button 
                                key={sub.language}
                                className={`vp-quality-item ${currentSubtitle === sub.language ? 'active' : ''}`}
                                onClick={() => handleSubtitleChange(sub.language)}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quality Selector */}
            {qualities.length > 0 && (
                <div className="vp-quality-container">
                    <button 
                        className="vp-btn" 
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        title="Chất lượng"
                    >
                        <Settings size={20} />
                    </button>
                    <div className={`vp-quality-menu ${showQualityMenu ? 'visible' : ''}`}>
                        <button 
                            className={`vp-quality-item ${currentQuality === -1 ? 'active' : ''}`}
                            onClick={() => handleQualityChange(-1)}
                        >
                            Tự động
                        </button>
                        {qualities.map((q) => (
                            <button 
                                key={q.index}
                                className={`vp-quality-item ${currentQuality === q.index ? 'active' : ''}`}
                                onClick={() => handleQualityChange(q.index)}
                            >
                                {q.height}p
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button className="vp-btn" onClick={() => {
                if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(0, currentTime - 10);
                }
            }} title="Tua lại 10s">
              <RotateCcw size={20} />
            </button>
            
            <button className="vp-btn" onClick={() => {
                if (videoRef.current) {
                    videoRef.current.currentTime = Math.min(duration, currentTime + 5);
                }
            }} title="Tua tới 5s">
              <RotateCw size={20} />
            </button>

            <button className="vp-btn" onClick={toggleFullscreen} title="Toàn màn hình">
              {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;