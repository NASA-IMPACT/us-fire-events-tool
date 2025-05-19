import { useRef, useState } from 'react';
import { format } from 'date-fns';
import WebMWriter from 'webm-writer';
import { GIFBuilder } from '@loaders.gl/video';

export const useRecordVideo = ({
  currentPerimeter,
  show3DMap,
  toggle3DMap,
  windLayerType,
  setWindLayerType,
  animationSpeed,
  videoFps,
  exportFormat,
  timePoints,
  resetAnimation,
  setIsPlaying
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingToRecord, setIsPreparingToRecord] = useState(false);

  const webmWriterRef = useRef(null);
  const capturedGifFrames = useRef([]);
  const recordingEndTimeoutRef = useRef(null);
  const frameCountRef = useRef(0);
  const totalFramesRef = useRef(0);
  const isRecordingRef = useRef(false);

  const prepareToRecord = () => {
    if (!show3DMap) toggle3DMap();
    if (windLayerType === 'wind') setWindLayerType('grid');
    setIsPreparingToRecord(true);
    resetAnimation();
  };

  const startRecording = () => {
    try {
      clearTimeout(recordingEndTimeoutRef.current);
      setIsPreparingToRecord(false);
      isRecordingRef.current = true;
      setIsRecording(true);
      webmWriterRef.current = new WebMWriter({
        quality: 0.95,
        frameRate: videoFps,
        transparent: false,
        debug: true
      });
      resetAnimation();
      frameCountRef.current = 0;
      setTimeout(() => setIsPlaying(true), 500);
      const duration = timePoints.length * animationSpeed;
      totalFramesRef.current = Math.ceil(videoFps * (duration / 1000) * 1.2);
    } catch (error) {
      console.error('Error starting recording:', error);
      isRecordingRef.current = false;
      setIsRecording(false);
      setIsPreparingToRecord(false);
    }
  };

  const captureFrame = () => {
    if (!isRecordingRef.current || !webmWriterRef.current) return;
    try {
      const canvas = document.getElementById('deckgl-overlay');
      if (!canvas || !currentPerimeter?.time) return;
      const composite = document.createElement('canvas');
      composite.width = canvas.width;
      composite.height = canvas.height;
      const ctx = composite.getContext('2d', { alpha: false });
      ctx.fillRect(0, 0, composite.width, composite.height);
      ctx.drawImage(canvas, 0, 0);

      const timestamp = format(new Date(currentPerimeter.time), 'yyyy-MM-dd HH:mm');
      ctx.font = '64px sans-serif';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.textAlign = 'right';
      ctx.strokeText(timestamp, composite.width - 32, 32);
      ctx.fillText(timestamp, composite.width - 32, 32);

      webmWriterRef.current.addFrame(composite);
      capturedGifFrames.current.push(composite);
      frameCountRef.current++;
    } catch (err) {
      console.error('Error capturing frame:', err);
    }
  };

  const stopRecording = async () => {
    clearTimeout(recordingEndTimeoutRef.current);
    setIsPlaying(false);
    isRecordingRef.current = false;
    try {
      const webMBlob = await webmWriterRef.current.complete();
      if (exportFormat === 'webm') {
        const url = URL.createObjectURL(webMBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fire-animation-${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }

      if (exportFormat === 'gif') {
        const first = capturedGifFrames.current[0];
        if (!first) return;
        const duration = Math.max(1, Math.round(10 / videoFps));
        const builder = new GIFBuilder({
          source: 'images',
          width: first.width,
          height: first.height,
          frameDuration: duration
        });
        capturedGifFrames.current.forEach(c => builder.add(c));
        const base64 = await builder.build();
        const blob = await (await fetch(base64)).blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fire-animation-${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.gif`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (err) {
      console.error('Error completing recording:', err);
    } finally {
      setIsRecording(false);
      setIsPreparingToRecord(false);
      capturedGifFrames.current = [];
    }
  };

  return {
    isRecording,
    isPreparingToRecord,
    prepareToRecord,
    startRecording,
    stopRecording,
    captureFrame,
    isRecordingRef,
    recordingEndTimeoutRef
  };
};
