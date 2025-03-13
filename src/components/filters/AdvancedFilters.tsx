import { useState, useEffect } from 'react';
import { useFilters } from '../../contexts/FiltersContext';
import ReactSlider from 'react-slider';

const sliderStyles = `
  .horizontal-slider {
    width: 100%;
    height: 20px;
    position: relative;
  }

  .horizontal-slider .track {
    top: 8px;
    height: 4px;
    background: #d9d9d9;
    border-radius: 2px;
  }

  .horizontal-slider .track-1 {
    background: #1a6baa;
  }

  .horizontal-slider .thumb {
    width: 16px;
    height: 16px;
    cursor: pointer;
    background: #fff;
    border-radius: 50%;
    border: 2px solid #1a6baa;
    top: 2px;
    outline: none;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }

  .horizontal-slider .thumb:hover {
    box-shadow: 0 0 0 2px rgba(26, 107, 170, 0.3);
  }

  .horizontal-slider .thumb:active {
    box-shadow: 0 0 0 2px rgba(26, 107, 170, 0.5);
  }

  .slider-value {
    font-weight: 400;
    font-size: 12px;
  }
`;

const AdvancedFilters: React.FC = () => {
  const {
    fireArea,
    duration,
    meanFrp,
    setFireAreaRange,
    setDurationRange,
    setMeanFrpRange,
  } = useFilters();

  const [localFireArea, setLocalFireArea] = useState([
    fireArea.min,
    fireArea.max
  ]);
  const [localDuration, setLocalDuration] = useState([
    duration.min,
    duration.max
  ]);
  const [localMeanFrp, setLocalMeanFrp] = useState([
    meanFrp.min,
    meanFrp.max
  ]);

  useEffect(() => {
    setLocalFireArea([fireArea.min, fireArea.max]);
    setLocalDuration([duration.min, duration.max]);
    setLocalMeanFrp([meanFrp.min, meanFrp.max]);
  }, [fireArea, duration, meanFrp]);

  const handleFireAreaChange = (value: number[]) => {
    setLocalFireArea(value);
    setFireAreaRange({ min: value[0], max: value[1] });
  };

  const handleDurationChange = (value: number[]) => {
    setLocalDuration(value);
    setDurationRange({ min: value[0], max: value[1] });
  };

  const handleMeanFrpChange = (value: number[]) => {
    setLocalMeanFrp(value);
    setMeanFrpRange({ min: value[0], max: value[1] });
  };

  return (
    <>
      <style>{sliderStyles}</style>
      <div className="bg-white padding-2">
        <div className="margin-bottom-3">
          <label className="font-body font-sans-3xs margin-bottom-1 display-block" htmlFor="fire-area-slider">
            Fire area (km<sup>2</sup>)
          </label>
          <div className="display-flex flex-align-center">
            <div className="border-1px padding-x-1 padding-y-05 width-6 height-4 display-flex flex-align-center flex-justify-center slider-value">
              {localFireArea[0]}
            </div>

            <div className="flex-fill padding-x-2">
              <ReactSlider
                id="fire-area-slider"
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="track"
                value={localFireArea}
                onChange={handleFireAreaChange}
                min={0}
                max={1000}
                ariaLabel={['Minimum fire area', 'Maximum fire area']}
                ariaValuetext={state => `${state} km²`}
                pearling
                minDistance={10}
              />
            </div>

            <div className="border-1px padding-x-1 padding-y-05 width-6 height-4 display-flex flex-align-center flex-justify-center slider-value">
              {localFireArea[1]}
            </div>
          </div>
        </div>

        <div className="margin-bottom-3">
          <label className="font-body font-sans-3xs margin-bottom-1 display-block" htmlFor="duration-slider">
            Duration (days)
          </label>
          <div className="display-flex flex-align-center">
            <div className="border-1px padding-x-1 padding-y-05 width-6 height-4 display-flex flex-align-center flex-justify-center slider-value">
              {localDuration[0]}
            </div>

            <div className="flex-fill padding-x-2">
              <ReactSlider
                id="duration-slider"
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="track"
                value={localDuration}
                onChange={handleDurationChange}
                min={0}
                max={30}
                ariaLabel={['Minimum duration', 'Maximum duration']}
                ariaValuetext={state => `${state} days`}
                pearling
                minDistance={1}
              />
            </div>

            <div className="border-1px padding-x-1 padding-y-05 width-6 height-4 display-flex flex-align-center flex-justify-center slider-value">
              {localDuration[1]}
            </div>
          </div>
        </div>

        <div className="margin-bottom-3">
          <label className="font-body font-sans-3xs margin-bottom-1 display-block" htmlFor="mean-frp-slider">
            Mean RFP (MW)
          </label>
          <div className="display-flex flex-align-center">
            <div className="border-1px padding-x-1 padding-y-05 width-6 height-4 display-flex flex-align-center flex-justify-center slider-value">
              {localMeanFrp[0]}
            </div>

            <div className="flex-fill padding-x-2">
              <ReactSlider
                id="mean-frp-slider"
                className="horizontal-slider"
                thumbClassName="thumb"
                trackClassName="track"
                value={localMeanFrp}
                onChange={handleMeanFrpChange}
                min={0}
                max={1000}
                ariaLabel={['Minimum FRP', 'Maximum FRP']}
                ariaValuetext={state => `${state} MW`}
                pearling
                minDistance={10}
              />
            </div>

            <div className="border-1px padding-x-1 padding-y-05 width-6 height-4 display-flex flex-align-center flex-justify-center slider-value">
              {localMeanFrp[1]}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedFilters;