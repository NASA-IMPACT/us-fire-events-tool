import { useState, useRef, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import WebMWriter from 'webm-writer';
import { GIFBuilder } from '@loaders.gl/video';

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
  baseFrameDelay
}: UseRecordVideoProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingToRecord, setIsPreparingToRecord] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [videoFps, setVideoFps] = useState(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [exportFormat, setExportFormat] = useState<'webm' | 'gif'>('gif');

  const webmWriterRef = useRef<WebMWriter | null>(null);
  const capturedGifFrames = useRef<HTMLCanvasElement[]>([]);
  const recordingEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);

  const interval =
    baseFrameDelay >= 500 ? 0.5 :
    baseFrameDelay >= 250 ? 0.25 : 0.1;

  const captureFrame = useCallback(() => {
    if (!isRecordingRef.current) return;

    const deckCanvas = document.getElementById('deckgl-overlay') as HTMLCanvasElement | null;
    if (!deckCanvas) return;

    const c = document.createElement('canvas');
    c.width = deckCanvas.width;
    c.height = deckCanvas.height;

    const ctx = c.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(deckCanvas, 0, 0);

    const perimeter = getCurrentPerimeter();
    if (!perimeter?.time) return;

    const ts = format(perimeter.time, 'yyyy-MM-dd HH:mm');
    ctx.font = '64px sans-serif';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.strokeText(ts, c.width - 32, 32);
    ctx.fillText(ts, c.width - 32, 32);

    if (webmWriterRef.current) webmWriterRef.current.addFrame(c);
    capturedGifFrames.current.push(c);
  }, [getCurrentPerimeter]);

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
    setIsRecording(true);
    animationCompleteRef.current = false;

    webmWriterRef.current = exportFormat === 'webm'
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

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) {
      setIsRecording(false);
      setIsPreparingToRecord(false);
      setIsExporting(false);
      return;
    }

    if (recordingEndTimeoutRef.current) clearTimeout(recordingEndTimeoutRef.current);

    isRecordingRef.current = false;
    setIsPlaying(false);
    setIsExporting(true);

    const finalize = async () => {
      try {
        if (exportFormat === 'webm' && webmWriterRef.current) {
          const blob = await webmWriterRef.current.complete();
          const url = URL.createObjectURL(blob);
          triggerDownload(url, 'webm');
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
      } catch (err) {
        console.error('Error exporting video:', err);
      }

      setIsRecording(false);
      setIsPreparingToRecord(false);
      setIsExporting(false);
      capturedGifFrames.current = [];
      webmWriterRef.current = null;
    };

    finalize();
  }, [exportFormat, setIsPlaying, interval]);

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
    exportFormat,
    setExportFormat,
    isRecordingRef,
    captureFrame,
    handleExportVideo,
    stopRecording
  };
}

function triggerDownload(url: string, ext: 'webm' | 'gif') {
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `fire-animation-${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.${ext}`
  });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
