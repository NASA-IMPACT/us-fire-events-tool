import { useState, useRef, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import WebMWriter from 'webm-writer';
import { GIFBuilder } from '@loaders.gl/video';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface Perimeter {
  time?: Date;
}

interface UseRecordVideoProps {
  show3DMap: boolean;
  toggle3DMap: () => void;
  windLayerType: string;
  setWindLayerType: (type: string) => void;
  resetAnimation: () => void;
  setIsPlaying: (value: boolean) => void;
  getCurrentPerimeter: () => Perimeter | null;
  animationCompleteRef: React.MutableRefObject<boolean>;
  baseFrameDelay: number;
  exportFormat: 'webm' | 'gif' | 'instagram';
  setExportFormat: (format: 'webm' | 'gif' | 'instagram') => void;
  setIsRecording: (recording: boolean) => void;
}

/**
 * A custom hook for recording the Deck.gl canvas as either a WebM or GIF animation.
 * Assumes a canvas with id="deckgl-overlay" is present in the DOM.
 *
 * - Records frames from Deck.gl using a canvas snapshot approach
 * - Overlays a timestamp (from a perimeter object) onto each frame
 * - Supports two export formats: WebM (via webm-writer) and GIF (via @loaders.gl)
 *
 **/

export default function useRecordVideo({
  show3DMap,
  toggle3DMap,
  windLayerType,
  setWindLayerType,
  resetAnimation,
  setIsPlaying,
  getCurrentPerimeter,
  animationCompleteRef,
  baseFrameDelay,
  exportFormat,
  setExportFormat,
  setIsRecording
}: UseRecordVideoProps) {
  const [isRecording, setIsRecordingLocal] = useState(false);
  const [isPreparingToRecord, setIsPreparingToRecord] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [videoFps, setVideoFps] = useState(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const webmWriterRef = useRef<WebMWriter | null>(null);
  const capturedGifFrames = useRef<HTMLCanvasElement[]>([]);
  const recordingEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);
  const nasaLogoRef = useRef<HTMLImageElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Load NASA logo
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      nasaLogoRef.current = img;
      console.log('NASA logo loaded successfully');
    };
    img.onerror = (e) => {
      console.warn('Failed to load NASA logo:', e);
    };
    // Use the NASA logo PNG from public folder
    img.src = '/nasa-logo.png';
  }, []);

  // Initialize FFmpeg for Instagram MP4 conversion
  useEffect(() => {
    const initFFmpeg = async () => {
      try {
        const ffmpeg = new FFmpeg();
        ffmpeg.on('log', ({ message }) => {
          console.log('FFmpeg:', message);
        });
        await ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm'
        });
        ffmpegRef.current = ffmpeg;
        console.log('FFmpeg loaded successfully');
      } catch (error) {
        console.warn('FFmpeg failed to load:', error);
      }
    };

    initFFmpeg();
  }, []);

  // Convert WebM to MP4 using FFmpeg
  const convertWebMToMP4 = useCallback(async (webmBlob: Blob): Promise<Blob | null> => {
    if (!ffmpegRef.current) {
      console.warn('FFmpeg not available, downloading as WebM with MP4 extension');
      return webmBlob;
    }

    try {
      const ffmpeg = ffmpegRef.current;
      
      // Write WebM file to FFmpeg filesystem
      await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));
      
      // Convert WebM to MP4 with H.264 codec optimized for social media
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        'output.mp4'
      ]);
      
      // Read the converted MP4 file
      const mp4Data = await ffmpeg.readFile('output.mp4');
      
      // Clean up FFmpeg filesystem
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('output.mp4');
      
      // Return MP4 blob
      return new Blob([mp4Data], { type: 'video/mp4' });
    } catch (error) {
      console.error('FFmpeg conversion failed:', error);
      return webmBlob; // Fallback to original WebM
    }
  }, []);

  const interval =
    baseFrameDelay >= 500 ? 0.5 :
    baseFrameDelay >= 250 ? 0.25 : 0.1;

  const captureFrame = useCallback(() => {
    if (!isRecordingRef.current) return;

    const deckCanvas = document.getElementById('deckgl-overlay') as HTMLCanvasElement | null;
    if (!deckCanvas) {
      console.warn('Deck canvas not found');
      return;
    }

    let c: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    if (exportFormat === 'instagram') {
      // For Instagram, create a 9:16 aspect ratio canvas
      const aspectRatio = 9 / 16;
      const canvasHeight = deckCanvas.height;
      const canvasWidth = canvasHeight * aspectRatio;
      
      console.log('Instagram capture:', {
        originalCanvas: { width: deckCanvas.width, height: deckCanvas.height },
        targetCanvas: { width: canvasWidth, height: canvasHeight },
        aspectRatio
      });
      
      c = document.createElement('canvas');
      c.width = canvasWidth;
      c.height = canvasHeight;
      
      ctx = c.getContext('2d', { alpha: false });
      if (!ctx) {
        console.warn('Could not get canvas context');
        return;
      }
      
      // Fill with black background
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, c.width, c.height);
      
      // Calculate the center crop area from the original canvas
      const sourceX = (deckCanvas.width - canvasWidth) / 2;
      const sourceY = 0;
      const sourceWidth = canvasWidth;
      const sourceHeight = canvasHeight;
      
      console.log('Crop area:', { sourceX, sourceY, sourceWidth, sourceHeight });
      
      // Draw the cropped portion of the deck canvas
      ctx.drawImage(
        deckCanvas,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, c.width, c.height
      );
    } else {
      // For other formats, use the full canvas
      c = document.createElement('canvas');
      c.width = deckCanvas.width;
      c.height = deckCanvas.height;

      ctx = c.getContext('2d', { alpha: false });
      if (!ctx) return;

      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(deckCanvas, 0, 0);
    }

    // Add timestamp overlay for all formats except Instagram
    let ts: string | undefined;
    if (exportFormat !== 'instagram') {
      const perimeter = getCurrentPerimeter();
      if (!perimeter?.time) {
        console.warn('No perimeter time available');
        return;
      }

      ts = format(perimeter.time, 'yyyy-MM-dd HH:mm');
      ctx.font = '64px sans-serif';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.strokeText(ts, c.width - 32, 32);
      ctx.fillText(ts, c.width - 32, 32);
    }

    // Add NASA logo in bottom right corner
    if (nasaLogoRef.current) {
      const logoSize = Math.min(c.width * 0.1, 120); // 10% of width, max 120px
      const logoX = c.width - logoSize - 20; // 20px margin from right
      const logoY = c.height - logoSize - 20; // 20px margin from bottom
      
      try {
        ctx.drawImage(
          nasaLogoRef.current,
          logoX,
          logoY,
          logoSize,
          logoSize
        );
      } catch (e) {
        console.warn('Failed to draw NASA logo:', e);
      }
    }

    console.log('Frame captured:', {
      format: exportFormat,
      canvasSize: { width: c.width, height: c.height },
      hasWebMWriter: !!webmWriterRef.current,
      timestamp: ts || 'none (Instagram format)'
    });

    if (webmWriterRef.current) webmWriterRef.current.addFrame(c);
    capturedGifFrames.current.push(c);
  }, [getCurrentPerimeter, exportFormat]);

  const prepareToRecord = useCallback(() => {
    if (!show3DMap) toggle3DMap();
    if (windLayerType === 'wind') setWindLayerType('grid');

    animationCompleteRef.current = false;
    setIsPreparingToRecord(true);
    resetAnimation();
  }, [show3DMap, toggle3DMap, windLayerType, setWindLayerType, animationCompleteRef, resetAnimation]);

  const startRecording = useCallback(() => {
    if (recordingEndTimeoutRef.current) clearTimeout(recordingEndTimeoutRef.current);

    setIsPreparingToRecord(false);
    isRecordingRef.current = true;
    setIsRecordingLocal(true);
    setIsRecording(true); // Update global state
    animationCompleteRef.current = false;

    webmWriterRef.current = exportFormat === 'webm' || exportFormat === 'instagram'
      ? new WebMWriter({
          quality: 0.95,
          frameRate: 1000 / baseFrameDelay,
          transparent: false,
          debug: true
        })
      : null;

    capturedGifFrames.current = [];
    resetAnimation();
    setTimeout(() => setIsPlaying(true), 500);
  }, [exportFormat, baseFrameDelay, resetAnimation, setIsPlaying, animationCompleteRef]);

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) {
      setIsRecordingLocal(false);
      setIsRecording(false); // Update global state
      setIsPreparingToRecord(false);
      setIsExporting(false);
      return null;
    }

    if (recordingEndTimeoutRef.current) clearTimeout(recordingEndTimeoutRef.current);

    isRecordingRef.current = false;
    setIsPlaying(false);
    setIsExporting(true);

    const finalize = async () => {
      try {
        let resultBlob = null;
        
        if ((exportFormat === 'webm' || exportFormat === 'instagram') && webmWriterRef.current) {
          const webmBlob = await webmWriterRef.current.complete();
          
          if (exportFormat === 'instagram') {
            // Convert WebM to proper MP4 for Instagram
            console.log('Converting WebM to MP4 for Instagram...');
            const mp4Blob = await convertWebMToMP4(webmBlob);
            if (mp4Blob) {
              const url = URL.createObjectURL(mp4Blob);
              triggerDownload(url, 'instagram');
              resultBlob = mp4Blob;
            } else {
              console.error('MP4 conversion failed');
              return null;
            }
          } else {
            const url = URL.createObjectURL(webmBlob);
            triggerDownload(url, 'webm');
            resultBlob = webmBlob;
          }
        }

        if (exportFormat === 'gif' && capturedGifFrames.current.length > 0) {
          const [first] = capturedGifFrames.current;

          const scale = 0.6;
          const width = Math.floor(first.width * scale);
          const height = Math.floor(first.height * scale);

          const gifBuilder = new GIFBuilder({
            source: 'images',
            width,
            height,
            sampleInterval: 10,
            numFrames: capturedGifFrames.current.length,
            interval
          });

          capturedGifFrames.current.forEach(c => gifBuilder.add(c));
          const base64 = await gifBuilder.build();
          const blob = await (await fetch(base64)).blob();
          const url = URL.createObjectURL(blob);
          triggerDownload(url, 'gif');
        }
        
        setIsRecordingLocal(false);
        setIsRecording(false); // Update global state
        setIsPreparingToRecord(false);
        setIsExporting(false);
        capturedGifFrames.current = [];
        webmWriterRef.current = null;
        
        return resultBlob;
      } catch (err) {
        console.error('Error exporting video:', err);
        setIsRecordingLocal(false);
        setIsRecording(false); // Update global state
        setIsPreparingToRecord(false);
        setIsExporting(false);
        return null;
      }
    };

    return await finalize();
  }, [exportFormat, setIsPlaying, interval]);

  // New function to get WebM blob for social media export
  const getWebMBlob = useCallback(async (): Promise<Blob | null> => {
    if (exportFormat !== 'webm' || !webmWriterRef.current) {
      console.warn('WebM format not available for social media export');
      return null;
    }
    
    try {
      return await webmWriterRef.current.complete();
    } catch (err) {
      console.error('Error getting WebM blob:', err);
      return null;
    }
  }, [exportFormat]);

  const handleExportVideo = useCallback(() => {
    if (isRecordingRef.current) stopRecording();
    else if (isPreparingToRecord) startRecording();
    else prepareToRecord();
  }, [isPreparingToRecord, startRecording, stopRecording, prepareToRecord]);

  useEffect(() => {
    return () => {
      if (recordingEndTimeoutRef.current) clearTimeout(recordingEndTimeoutRef.current);
    };
  }, []);

  return {
    isRecording,
    isPreparingToRecord,
    isExporting,
    videoFps,
    setVideoFps,
    speedMultiplier,
    setSpeedMultiplier,
    isRecordingRef,
    captureFrame,
    handleExportVideo,
    stopRecording,
    getWebMBlob
  };
}

function triggerDownload(url: string, ext: 'webm' | 'gif' | 'instagram') {
  const fileExt = ext === 'instagram' ? 'mp4' : ext;
  const fileName = ext === 'instagram' ? 'instagram-reel' : 'fire-animation';
  
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `${fileName}-${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.${fileExt}`
  });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
