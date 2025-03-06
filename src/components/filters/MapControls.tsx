import { Label } from '@trussworks/react-uswds';
import ReactSlider from 'react-slider';

interface MapControlsProps {
  opacity: number;
  setOpacity: (value: number) => void;
  showWindDirection: boolean;
  setShowWindDirection: (show: boolean) => void;
  show3DMap: boolean;
  setShow3DMap: (show: boolean) => void;
}

const sliderStyles = `
  .opacity-slider {
    width: 100%;
    height: 24px;
    margin: 5px 0;
    position: relative;
  }

  .opacity-slider .track {
    top: 9px;
    height: 4px;
    background: #d9d9d9;
    border-radius: 2px;
  }

  .opacity-slider .track-0 {
    background: #0d77e2;
  }

  .opacity-slider .thumb {
    width: 20px;
    height: 20px;
    cursor: pointer;
    background: #fff;
    border-radius: 50%;
    border: 2px solid #0d77e2;
    top: 1px;
    outline: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .opacity-slider .thumb:hover {
    box-shadow: 0 0 0 3px rgba(13, 119, 226, 0.3);
  }

  .opacity-slider .thumb:active {
    box-shadow: 0 0 0 3px rgba(13, 119, 226, 0.5);
  }

  .percent-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 40px;
    background: white;
    border: 1px solid #d9d9d9;
    color: #333;
    text-align: center;
    font-size: 18px;
    font-weight: 500;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-right: 20px;
  }

  .legend-color {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }

  .legend-label {
    font-size: 16px;
    color: #333;
  }

  .control-label {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #333;
  }

  .map-controls-section {
    margin-bottom: 24px;
  }

  .checkbox-control {
    margin-top: 8px;
    display: flex;
    align-items: center;
  }

  .checkbox-control input {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }

  .checkbox-label {
    font-size: 16px;
    color: #333;
  }
`;

const MapControls: React.FC<MapControlsProps> = ({
  opacity,
  setOpacity,
  showWindDirection,
  setShowWindDirection,
  show3DMap,
  setShow3DMap
}) => {
  const handleOpacityChange = (value: number) => {
    setOpacity(value);
  };

  return (
    <>
      <style>{sliderStyles}</style>
      <div className="bg-white padding-4 radius-md">
        <h2 className="control-label margin-top-0 margin-bottom-3">Fire spread</h2>

        <div className="display-flex flex-align-center margin-bottom-4">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8A8D91' }}></div>
            <span className="legend-label">Past</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#E03C31' }}></div>
            <span className="legend-label">Current</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#F9BF54' }}></div>
            <span className="legend-label">Perimeter</span>
          </div>
        </div>

        <div className="map-controls-section">
          <Label htmlFor="opacity-slider" className="margin-bottom-1">Opacity</Label>
          <div className="display-flex flex-align-center">
            <div className="flex-fill padding-right-2">
              <ReactSlider
                className="opacity-slider"
                thumbClassName="thumb"
                trackClassName="track"
                value={opacity}
                onChange={handleOpacityChange}
                min={0}
                max={100}
                ariaLabel="Opacity"
                ariaValuetext={state => `${state}%`}
              />
            </div>
            <div className="percent-box">
              {opacity}%
            </div>
          </div>
        </div>

        <div className="border-top-1px border-base-lighter margin-y-3"></div>

        <div className="checkbox-control">
          <input
            type="checkbox"
            id="wind-direction-checkbox"
            checked={showWindDirection}
            onChange={(e) => setShowWindDirection(e.target.checked)}
          />
          <label htmlFor="wind-direction-checkbox" className="checkbox-label">
            Wind direction
          </label>
        </div>

        <div className="checkbox-control margin-top-2">
          <input
            type="checkbox"
            id="3d-map-checkbox"
            checked={show3DMap}
            onChange={(e) => setShow3DMap(e.target.checked)}
          />
          <label htmlFor="3d-map-checkbox" className="checkbox-label">
            3D map
          </label>
        </div>
      </div>
    </>
  );
};

export default MapControls;