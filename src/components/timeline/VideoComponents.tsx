import { Loader2, Pause, Play, RotateCw, Video, X } from 'lucide-react';

export const ExportSettings = ({
  exportFormat,
  setExportFormat,
  baseFrameDelay,
  setBaseFrameDelay,
  isMobile,
}) => (
  <>
    {!isMobile && (
      <div className="display-flex flex-align-center flex-col margin-right-2">
        <span className="font-role-body font-weight-regular font-body-3xs color-base-ink margin-right-1">
          Format
        </span>
        <select
          className="usa-select margin-top-0"
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value)}
        >
          <option value="webm">WebM</option>
          <option value="gif">GIF</option>
        </select>
      </div>
    )}
    <div className="display-flex flex-align-center flex-col">
      <span className="font-role-body font-weight-regular font-body-3xs color-base-ink margin-right-1">
        Speed
      </span>
      <select
        className="usa-select margin-top-0"
        value={baseFrameDelay}
        onChange={(e) => setBaseFrameDelay(Number(e.target.value))}
      >
        <option value={500}>1x</option>
        <option value={250}>2x</option>
        <option value={50}>3x</option>
      </select>
    </div>
  </>
);

export const ExportButton = ({
  isExporting,
  isRecording,
  isPreparingToRecord,
  handleExportVideo,
}) => (
  <button
    style={{ height: '40px' }}
    className={`usa-button export-button font-body-3xs padding-1 ${
      isExporting
        ? 'bg-base-lighter color-base font-italic'
        : isPreparingToRecord
        ? 'preparing'
        : isRecording
        ? 'recording'
        : ''
    }`}
    onClick={handleExportVideo}
    disabled={isExporting}
  >
    {isExporting ? (
      <>
        Processing... <Loader2 size={16} className="spin margin-left-1" />
      </>
    ) : isRecording ? (
      <>
        Stop Recording <X size={16} className="margin-left-1" />
      </>
    ) : isPreparingToRecord ? (
      <>
        Start Recording <Video size={16} className="margin-left-1" />
      </>
    ) : (
      <>
        Prepare Video <Video size={16} className="margin-left-1" />
      </>
    )}
  </button>
);

export const PlaybackControls = ({
  isPlaying,
  togglePlayback,
  resetAnimation,
  isRecording,
  isPreparingToRecord,
  isMobile,
}) =>
  isMobile ? (
    <div className="display-flex flex-align-center width-full flex-justify-center">
      <button
        className="control-button padding-1"
        onClick={togglePlayback}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        disabled={isRecording || isPreparingToRecord}
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>
      <button
        className="control-button padding-1 margin-left-1"
        onClick={resetAnimation}
        aria-label="Reset"
        disabled={isRecording || isPreparingToRecord}
      >
        <RotateCw size={24} />
      </button>
    </div>
  ) : (
    <div className="display-flex flex-align-center">
      <button
        className="control-button padding-1"
        onClick={togglePlayback}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        disabled={isRecording || isPreparingToRecord}
      >
        {isPlaying ? <Pause size={12} /> : <Play size={16} />}
      </button>
      <button
        className="control-button padding-1 margin-left-1"
        onClick={resetAnimation}
        aria-label="Reset"
        disabled={isRecording || isPreparingToRecord}
      >
        <RotateCw size={16} />
      </button>
    </div>
  );
