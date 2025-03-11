import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useAppState } from '../../contexts/AppStateContext';
import { useEvents, getFeatureProperties, getFireId } from '../../contexts/EventsContext';

interface EventDetailsProps {
  onBack: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ onBack }) => {
  const { selectedEventId, events } = useEvents();
  const { showWindLayer, show3DMap, toggleWindLayer, toggle3DMap } = useAppState();

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find(event => getFireId(event) === selectedEventId) || null;
  }, [selectedEventId, events]);

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

  const startDate = eventProperties.t ? new Date(eventProperties.t) : null;
  const endDate = startDate && eventProperties.duration ?
    new Date(startDate.getTime() + (eventProperties.duration * 24 * 60 * 60 * 1000)) :
    null;

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return format(date, 'MMM d, yyyy');
  };

  const area = eventProperties.farea ? Number(eventProperties.farea).toFixed(2) : '0.00';
  const durationDays = eventProperties.duration ? Math.round(eventProperties.duration) : 0;
  const meanRFP = eventProperties.meanfrp ? Number(eventProperties.meanfrp).toFixed(2) : '0.00';
  const perimeter = eventProperties.fperim ? Number(eventProperties.fperim).toFixed(2) : '0.00';
  const pixelDensity = eventProperties.pixden ? Number(eventProperties.pixden).toFixed(2) : '0.00';
  const newPixels = eventProperties.n_newpixels || 0;
  const totalPixels = eventProperties.n_pixels || 0;

  return (
    <div className="height-full display-flex flex-column bg-white">
      <div className="padding-y-2 padding-x-3 border-bottom border-base-lighter display-flex flex-row flex-align-center">
        <button
          className="usa-button usa-button--unstyled text-base-dark display-flex flex-align-center"
          onClick={onBack}
        >
          <svg className="margin-right-1" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
          </svg>
          <span className="text-underline">Back to all fire events</span>
        </button>
      </div>

      <div className="padding-x-3 padding-y-3 overflow-auto flex-fill">
        <div className="display-flex flex-align-center margin-bottom-1">
          <span className={`margin-right-1 ${isActive ? 'text-error' : 'text-base-dark'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"/>
            </svg>
          </span>
          <h1 className={`font-sans-md margin-0 ${isActive ? 'text-error' : 'text-base-dark'}`}>
            {eventName}
          </h1>
        </div>

        <div className="margin-bottom-3">
          <span className="text-base-dark font-sans-sm">
            {formatDate(startDate)} → {formatDate(endDate)}
          </span>
        </div>

        <div className="display-flex flex-row margin-bottom-2 grid-gap-3">
          <div className="border-1px border-base-lighter radius-md padding-3 flex-fill margin-right-2">
            <h3 className="margin-0 margin-bottom-1 font-sans-sm text-base-dark font-normal">Area</h3>
            <div className="margin-0 text-base-dark">
              <span className="font-sans-xl">{area}</span> <span className="font-sans-xs">km²</span>
            </div>
          </div>

          <div className="border-1px border-base-lighter radius-md padding-3 flex-fill">
            <h3 className="margin-0 margin-bottom-1 font-sans-sm text-base-dark font-normal">Duration</h3>
            <div className="margin-0 text-base-dark">
              <span className="font-sans-xl">{durationDays}</span> <span className="font-sans-xs">days</span>
            </div>
          </div>
        </div>

        <div className="display-flex flex-row margin-bottom-2 grid-gap-3">
          <div className="border-1px border-base-lighter radius-md padding-3 flex-fill margin-right-2">
            <h3 className="margin-0 margin-bottom-1 font-sans-sm text-base-dark font-normal display-flex flex-align-center">
              Mean RFP
              <span className="margin-left-1 text-base-dark">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/>
                  <path d="M9 4H7v5h2V4zm0 6H7v2h2v-2z"/>
                </svg>
              </span>
            </h3>
            <div className="margin-0 text-base-dark">
              <span className="font-sans-xl">{meanRFP}</span> <span className="font-sans-xs">MW</span>
            </div>
          </div>

          <div className="border-1px border-base-lighter radius-md padding-3 flex-fill">
            <h3 className="margin-0 margin-bottom-1 font-sans-sm text-base-dark font-normal">Perimeter</h3>
            <div className="margin-0 text-base-dark">
              <span className="font-sans-xl">{perimeter}</span> <span className="font-sans-xs">km</span>
            </div>
          </div>
        </div>

        <div className="border-top-0">
          <table className="usa-table usa-table--borderless width-full">
            <tbody>
              <tr className="border-top-0">
                <th scope="row" className="text-base-dark font-sans-sm padding-y-2 padding-x-0 border-top-0">Status</th>
                <td className="text-base-dark font-sans-sm text-right padding-y-2 padding-x-0 border-top-0">
                  <span className={`margin-left-1 font-sans-2xs text-white bg-${isActive ? 'error' : 'base-dark'} radius-pill padding-x-2 padding-y-05`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row" className="text-base-dark font-sans-sm padding-y-2 padding-x-0">Pixel density</th>
                <td className="text-base-dark font-sans-sm text-right padding-y-2 padding-x-0">{pixelDensity} px/km²</td>
              </tr>
              <tr>
                <th scope="row" className="text-base-dark font-sans-sm padding-y-2 padding-x-0">New pixels</th>
                <td className="text-base-dark font-sans-sm text-right padding-y-2 padding-x-0">{newPixels}</td>
              </tr>
              <tr>
                <th scope="row" className="text-base-dark font-sans-sm padding-y-2 padding-x-0">Total pixels</th>
                <td className="text-base-dark font-sans-sm text-right padding-y-2 padding-x-0">{totalPixels}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="margin-top-4 margin-bottom-3 border-top-1px border-bottom-1px border-base-lighter padding-y-2">
          <h3 className="margin-top-0 margin-bottom-2 font-sans-md text-base-dark">Fire spread</h3>

          <div className="display-flex flex-wrap">
            <div className="display-flex flex-align-center margin-right-4 margin-bottom-1">
              <div className="width-3 height-3 bg-base-dark margin-right-1"></div>
              <span className="text-base-dark font-sans-sm">Previous</span>
            </div>

            <div className="display-flex flex-align-center margin-right-4 margin-bottom-1">
              <div className="width-3 height-3 bg-error margin-right-1"></div>
              <span className="text-base-dark font-sans-sm">Current</span>
            </div>

            <div className="display-flex flex-align-center margin-bottom-1">
              <div className="width-3 height-3 bg-warning margin-right-1"></div>
              <span className="text-base-dark font-sans-sm">Perimeter</span>
            </div>
          </div>

          <div className="margin-top-3">
            <div className="margin-bottom-1">
              <label className="text-base-dark font-sans-sm">Opacity</label>
            </div>
            <div className="display-flex flex-align-center">
              <input
                type="range"
                className="usa-range flex-fill"
                min="0"
                max="100"
                defaultValue="100"
              />
              <span className="margin-left-2 text-base-dark font-sans-sm border-1px border-base-lighter padding-x-2 padding-y-1">
                100%
              </span>
            </div>
          </div>
        </div>

        <div className="margin-top-1 padding-top-1">
          <div className="display-flex flex-align-center">
            <label className="usa-checkbox margin-right-4">
              <input
                className="usa-checkbox__input"
                type="checkbox"
                name="wind-direction"
                checked={showWindLayer}
                onChange={toggleWindLayer}
              />
              <span className="usa-checkbox__label font-sans-sm">Wind direction</span>
            </label>

            <label className="usa-checkbox">
              <input
                className="usa-checkbox__input"
                type="checkbox"
                name="3d-map"
                checked={show3DMap}
                onChange={toggle3DMap}
              />
              <span className="usa-checkbox__label font-sans-sm">3D map</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;