import { useState, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';

export type SocialPlatform = 'tiktok' | 'instagram' | 'linkedin' | 'all';

interface SocialExportOptions {
  platform: SocialPlatform;
  fireMetadata: {
    name: string;
    dateRange: string;
    location?: string;
  };
}

interface SocialFormat {
  name: string;
  aspectRatio: string;
  width: number;
  height: number;
  maxDuration: number;
  description: string;
}

const SOCIAL_FORMATS: Record<Exclude<SocialPlatform, 'all'>, SocialFormat> = {
  tiktok: {
    name: 'TikTok/Instagram Reels',
    aspectRatio: '9:16',
    width: 720,
    height: 1280,
    maxDuration: 60,
    description: 'Vertical format for TikTok and Instagram Reels'
  },
  instagram: {
    name: 'Instagram Post',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    maxDuration: 60,
    description: 'Square format for Instagram posts'
  },
  linkedin: {
    name: 'LinkedIn',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    maxDuration: 600,
    description: 'Professional format for LinkedIn'
  }
};

export default function useSocialMediaExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);

  const initializeFFmpeg = useCallback(async () => {
    if (ffmpeg) return ffmpeg;
    
    const ffmpegInstance = new FFmpeg();
    
    ffmpegInstance.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });
    
    ffmpegInstance.on('progress', ({ progress }) => {
      setExportProgress(progress * 100);
    });

    await ffmpegInstance.load();
    setFFmpeg(ffmpegInstance);
    return ffmpegInstance;
  }, [ffmpeg]);

  const convertWebMToSocialFormat = useCallback(async (
    webmBlob: Blob,
    format: SocialFormat,
    fireMetadata: SocialExportOptions['fireMetadata']
  ) => {
    const ffmpegInstance = await initializeFFmpeg();
    
    // Convert blob to Uint8Array
    const webmArrayBuffer = await webmBlob.arrayBuffer();
    const webmData = new Uint8Array(webmArrayBuffer);
    
    // Write input file
    await ffmpegInstance.writeFile('input.webm', webmData);
    
    // Build FFmpeg command for format conversion and overlay
    const outputName = `output_${format.aspectRatio.replace(':', 'x')}.mp4`;
    
    // Create overlay text
    const overlayText = [
      fireMetadata.name,
      fireMetadata.dateRange,
      'Source: NASA Earth Science'
    ].filter(Boolean).join(' | ');
    
    const ffmpegArgs = [
      '-i', 'input.webm',
      '-vf', buildVideoFilter(format, overlayText),
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputName
    ];
    
    await ffmpegInstance.exec(ffmpegArgs);
    
    // Read output file
    const outputData = await ffmpegInstance.readFile(outputName);
    
    // Clean up
    await ffmpegInstance.deleteFile('input.webm');
    await ffmpegInstance.deleteFile(outputName);
    
    return new Blob([outputData], { type: 'video/mp4' });
  }, [initializeFFmpeg]);

  const exportForSocial = useCallback(async (
    webmBlob: Blob,
    options: SocialExportOptions
  ) => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      if (options.platform === 'all') {
        // Export all formats
        const results = await Promise.all([
          convertWebMToSocialFormat(webmBlob, SOCIAL_FORMATS.tiktok, options.fireMetadata),
          convertWebMToSocialFormat(webmBlob, SOCIAL_FORMATS.instagram, options.fireMetadata),
          convertWebMToSocialFormat(webmBlob, SOCIAL_FORMATS.linkedin, options.fireMetadata)
        ]);
        
        // Download all formats
        results.forEach((blob, index) => {
          const formats = Object.values(SOCIAL_FORMATS);
          downloadBlob(blob, `fire-${options.fireMetadata.name}-${formats[index].aspectRatio}`);
        });
        
        return results;
      } else {
        // Export single format
        const format = SOCIAL_FORMATS[options.platform];
        const result = await convertWebMToSocialFormat(webmBlob, format, options.fireMetadata);
        downloadBlob(result, `fire-${options.fireMetadata.name}-${format.aspectRatio}`);
        return result;
      }
    } catch (error) {
      console.error('Social media export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [convertWebMToSocialFormat]);

  return {
    isExporting,
    exportProgress,
    exportForSocial,
    socialFormats: SOCIAL_FORMATS
  };
}

function buildVideoFilter(format: SocialFormat, overlayText: string): string {
  const { width, height } = format;
  
  // Create filter for aspect ratio conversion and text overlay
  const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
  
  // Add text overlay with NASA branding
  const textFilter = [
    // Main title text
    `drawtext=text='${overlayText}':fontsize=32:fontcolor=white:x=20:y=h-80:borderw=2:bordercolor=black`,
    // NASA logo placeholder (you'd replace with actual logo)
    `drawtext=text='NASA':fontsize=24:fontcolor=white:x=w-100:y=20:borderw=2:bordercolor=black`
  ].join(',');
  
  return `${scaleFilter},${textFilter}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
