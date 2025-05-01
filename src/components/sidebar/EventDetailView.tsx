import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useAppState } from '../../contexts/AppStateContext';
import { useEvents, getFeatureProperties, getFireId, MVTFeature } from '../../contexts/EventsContext';
import ReactSlider from 'react-slider';
import { useMap } from '../../contexts/MapContext';
import { ToggleSlider } from "react-toggle-slider";

interface EventDetailsProps {
  onBack: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ onBack }) => {
  const { selectedEventId, firePerimeters } = useEvents();
  const { windLayerType, setWindLayerType, show3DMap, toggle3DMap } = useAppState();
  const { layerOpacity, setLayerOpacity } = useMap();

  const selectedEvent = useMemo(() => {
    if (!selectedEventId || !firePerimeters?.features?.length) return null;
    return firePerimeters.features[firePerimeters.features.length - 1] as MVTFeature;
  }, [selectedEventId, firePerimeters]);

  const eventProperties = useMemo(() => {
    if (!selectedEvent) return null;
    return getFeatureProperties(selectedEvent);
  }, [selectedEvent]);

  if (!selectedEvent || !eventProperties) {
    return (
      <div className="padding-4 display-flex flex-column flex-align-center flex-justify-center">
        <p>No event selected</p>
        <button className="usa-button" onClick={onBack}>
          Back to list
        </button>
      </div>
    );
  }

  const fireId = getFireId(selectedEvent);
  const isActive = eventProperties.isactive === 1;
  const eventName = eventProperties.name || `Fire Event ${fireId}`;

  const endDate = eventProperties.t ? new Date(eventProperties.t) : null;
  const startDate = endDate && eventProperties.duration ?
    new Date(endDate.getTime() - (eventProperties.duration * 24 * 60 * 60 * 1000)) :
    null;

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return format(date, 'MMM d, yyyy');
  };

  const area = eventProperties.farea ? Number(eventProperties.farea).toFixed(2) : '0.00';
  const durationDays = eventProperties.duration ? eventProperties.duration : 0;
  const meanFRP = eventProperties.meanfrp ? Number(eventProperties.meanfrp).toFixed(2) : '0.00';
  const perimeter = eventProperties.fperim ? Number(eventProperties.fperim).toFixed(2) : '0.00';
  const pixelDensity = eventProperties.pixden ? Number(eventProperties.pixden).toFixed(2) : '0.00';
  const newPixels = eventProperties.n_newpixels || 0;
  const totalPixels = eventProperties.n_pixels || 0;

  return (
    <div className="height-full display-flex flex-column bg-white">
      <style>
        {`
          .opacity-slider {
            width: 100%;
            height: 6px;
            position: relative;
          }

          .opacity-slider .track {
            top: 2px;
            height: 4px;
            background: #d9d9d9;
            border-radius: 2px;
          }

          .opacity-slider .track-0 {
            background: #1a6baa;
          }

          .opacity-slider .thumb {
            width: 14px;
            height: 14px;
            cursor: pointer;
            background: #fff;
            border-radius: 50%;
            border: 2px solid #1a6baa;
            top: -5px;
            outline: none;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }

          .opacity-slider .thumb:hover {
            box-shadow: 0 0 0 2px rgba(26, 107, 170, 0.3);
          }

          .slider-value {
            font-size: 12px;
          }
        `}
      </style>
      <div className="padding-y-2 padding-x-3 border-bottom border-base-lighter display-flex flex-row flex-align-center">
        <button
          className="usa-button usa-button--unstyled text-base-dark display-flex flex-align-center"
          onClick={onBack}
        >
          <svg className="margin-right-1" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
          </svg>
          <span className="font-body font-weight-regular font-sans-3xs text-underline">Back to all fire events</span>
        </button>
      </div>

      <div className="padding-x-3 padding-y-3 overflow-auto flex-fill">
        <div className="display-flex flex-align-center margin-bottom-1">
          <span className={`margin-right-1 ${isActive ? 'text-error' : 'text-base-dark'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"/>
            </svg>
          </span>
          <h1 className={`font-body font-weight-700 font-sans-lg margin-0 ${isActive ? 'text-error' : 'text-base-ink'}`}>
            {eventName}
          </h1>
        </div>

        <div className="margin-bottom-3">
          <span className="font-body font-weight-regular font-sans-3xs text-base-dark">
            {formatDate(startDate)} → {formatDate(endDate)}
          </span>
        </div>

        <div className="display-flex flex-row margin-bottom-2 grid-gap-3">
          <div className="border-1px border-base-lighter radius-md padding-y-1 padding-x-2 flex-fill margin-right-2">
            <h3 className="margin-0 margin-bottom-1 font-body font-weight-bold font-sans-3xs text-base">Area</h3>
            <div className="margin-0 font-body font-weight-bold font-sans-lg text-base-ink">
              <span>{area}</span> <span className="font-sans-xs">km²</span>
            </div>
          </div>

          <div className="border-1px border-base-lighter radius-md padding-y-1 padding-x-2 flex-fill">
            <h3 className="margin-0 margin-bottom-1 font-body font-weight-bold font-sans-3xs text-base">Duration</h3>
            <div className="margin-0 font-body font-weight-bold font-sans-lg text-base-ink">
              <span>{durationDays}</span> <span className="font-sans-xs">days</span>
            </div>
          </div>
        </div>

        <div className="display-flex flex-row margin-bottom-2 grid-gap-3">
          <div className="border-1px border-base-lighter radius-md padding-y-1 padding-x-2 flex-fill margin-right-2">
            <h3 className="margin-0 margin-bottom-1 font-body font-weight-bold font-sans-3xs text-base display-flex flex-align-center">
              Mean FRP
              <span className="margin-left-1 text-base">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/>
                  <path d="M9 4H7v5h2V4zm0 6H7v2h2v-2z"/>
                </svg>
              </span>
            </h3>
            <div className="margin-0 font-body font-weight-bold font-sans-lg text-base-ink">
              <span>{meanFRP}</span> <span className="font-sans-xs">MW</span>
            </div>
          </div>

          <div className="border-1px border-base-lighter radius-md padding-y-1 padding-x-2 flex-fill">
            <h3 className="margin-0 margin-bottom-1 font-body font-weight-bold font-sans-3xs text-base">Perimeter</h3>
            <div className="margin-0 font-body font-weight-bold font-sans-lg text-base-ink">
              <span>{perimeter}</span> <span className="font-sans-xs">km</span>
            </div>
          </div>
        </div>

        <div className="border-top-0">
          <table className="usa-table usa-table--borderless width-full border-base-darker">
            <tbody>
              <tr className="border-top-0">
                <th scope="row" className="font-body font-weight-regular font-sans-3xs text-base-ink padding-y-2 padding-x-0 border-top-0">Status</th>
                <td className="font-body font-weight-regular font-sans-3xs text-base-ink text-right padding-y-2 padding-x-0 border-top-0">
                  <span className={`margin-left-1 font-sans-2xs text-white bg-${isActive ? 'error' : 'base-dark'} radius-sm padding-x-05 padding-y-05`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
              <tr className="border-base-darker">
                <th scope="row" className="font-body font-weight-regular font-sans-3xs text-base-ink padding-y-2 padding-x-0 border-base-darker">Pixel density</th>
                <td className="font-body font-weight-regular font-sans-3xs text-base-ink text-right padding-y-2 padding-x-0 border-base-darker">{pixelDensity} px/km²</td>
              </tr>
              <tr className="border-base-darker">
                <th scope="row" className="font-body font-weight-regular font-sans-3xs text-base-ink padding-y-2 padding-x-0 border-base-darker">New pixels</th>
                <td className="font-body font-weight-regular font-sans-3xs text-base-ink text-right padding-y-2 padding-x-0 border-base-darker">{newPixels}</td>
              </tr>
              <tr className="border-base-darker">
                <th scope="row" className="font-body font-weight-regular font-sans-3xs text-base-ink padding-y-2 padding-x-0 border-base-darker">Total pixels</th>
                <td className="font-body font-weight-regular font-sans-3xs text-base-ink text-right padding-y-2 padding-x-0 border-base-darker">{totalPixels}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="margin-top-3 margin-bottom-3 border-bottom-1px border-base-lighter padding-y-2">
          <h3 className="margin-top-0 margin-bottom-2 font-weight-700 font-sans-2xs text-base-dark">Fire spread</h3>

          <div className="display-flex flex-wrap">
            <div className="display-flex flex-align-center margin-right-4 margin-bottom-1">
              <div className="width-3 height-3 bg-base-dark margin-right-1"></div>
              <span className="font-body font-weight-regular font-sans-3xs text-base-dark">Previous</span>
            </div>

            <div className="display-flex flex-align-center margin-right-4 margin-bottom-1">
              <div className="width-3 height-3 bg-error margin-right-1"></div>
              <span className="font-body font-weight-regular font-sans-3xs text-base-dark">Current</span>
            </div>

            <div className="display-flex flex-align-center margin-bottom-1">
              <div className="width-3 height-3 bg-warning margin-right-1"></div>
              <span className="font-body font-weight-regular font-sans-3xs text-base-dark">Perimeter</span>
            </div>
          </div>

          <div className="margin-top-3">
            <div className="display-flex flex-align-center margin-bottom-1">
              <label className="font-body font-weight-bold font-sans-3xs text-base-ink margin-right-2">Opacity</label>
              <div className="display-flex flex-align-center flex-fill">
                <ReactSlider
                  className="opacity-slider flex-fill"
                  thumbClassName="thumb"
                  trackClassName="track"
                  min={0}
                  max={100}
                  value={layerOpacity}
                  onChange={setLayerOpacity}
                />
                <span className="slider-value margin-left-2 text-base-dark border-1px border-base-lighter padding-x-2 padding-y-1">
                  {layerOpacity}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="margin-top-1 padding-top-1">
          <div className="display-flex flex-column">
            <div className="margin-bottom-2">
              <div className="display-flex flex-align-center flex-justify">
                <label className="usa-checkbox margin-0">
                  <input
                    className="usa-checkbox__input"
                    type="checkbox"
                    checked={windLayerType !== null}
                    onChange={(e) => setWindLayerType(e.target.checked ? 'wind' : null)}
                  />
                  <span className="usa-checkbox__label font-ui font-sans-2xs text-base-ink margin-top-0">
                    Wind direction
                  </span>
                </label>

                <div
                  className="display-flex flex-align-center"
                  style={{
                    opacity: windLayerType === null ? 0.5 : 1,
                    pointerEvents: windLayerType === null ? 'none' : 'auto',
                  }}
                >
                  <ToggleSlider
                    key={windLayerType === null ? 'off' : windLayerType}
                    active={windLayerType === 'wind'}
                    onToggle={(state) => setWindLayerType(state ? 'wind' : 'grid')}
                    barHeight={20}
                    barWidth={40}
                    handleSize={16}
                    barBackgroundColor="#e0e0e0"
                    barBackgroundColorActive="#1a6baa"
                    handleBackgroundColor="#ffffff"
                    handleBorderRadius={10}
                    barBorderRadius={10}
                  />

                  <span className="font-sans-3xs text-base margin-left-1 text-base-dark">
                    Animate
                  </span>
                </div>
              </div>
            </div>

            <label className="usa-checkbox">
              <input
                className="usa-checkbox__input"
                type="checkbox"
                name="3d-map"
                checked={show3DMap}
                onChange={toggle3DMap}
              />
              <span className="usa-checkbox__label font-ui font-weight-regular font-sans-2xs text-base-ink">3D map</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;