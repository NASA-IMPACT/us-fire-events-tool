import { useMemo, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { EventFeature } from '../../types/events';
import { useAppState } from '../../contexts/AppStateContext';

const calculateCentroid = (coordinates: number[][]) => {
  let sumLng = 0;
  let sumLat = 0;

  coordinates.forEach(([lng, lat]) => {
    sumLng += lng;
    sumLat += lat;
  });

  return [
    sumLng / coordinates.length,
    sumLat / coordinates.length
  ];
};


interface EventListProps {
  features: EventFeature[];
  selectedId: string | null;
  onSelectFeature: (id: string) => void;
}

const EventList: React.FC<EventListProps> = ({ features, selectedId, onSelectFeature }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { mapBounds } = useAppState();

  const { totalEvents, activeEvents, inactiveEvents } = useMemo(() => {
    const active = features.filter(f => f.properties.isactive === 1);
    return {
      totalEvents: features.length,
      activeEvents: active.length,
      inactiveEvents: features.length - active.length
    };
  }, [features]);

  const filteredFeatures = useMemo(() => {
    if (!mapBounds) return features;

    const [minLng, minLat, maxLng, maxLat] = mapBounds;

    return features.filter((event) => {
      if (event.geometry.type !== 'Polygon') return false;

      const outerRing = event.geometry.coordinates[0];

      const [centroidLng, centroidLat] = calculateCentroid(outerRing);

      return (
        centroidLng >= minLng &&
        centroidLng <= maxLng &&
        centroidLat >= minLat &&
        centroidLat <= maxLat
      );
    });
  }, [features, mapBounds]);


  const groupedEvents = useMemo(() => {
    const uniqueEvents = new Map();

    filteredFeatures.forEach(feature => {
      const fireId = feature.properties.fireid.toString();
      if (!uniqueEvents.has(fireId) || feature.properties.isactive === 1) {
        uniqueEvents.set(fireId, feature);
      }
    });

    return Array.from(uniqueEvents.values());
  }, [filteredFeatures]);

  const sortedGroupedEvents = useMemo(() => {
    return groupedEvents.sort((a, b) => {
      const isActiveA = a.properties.isactive === 1 ? 0 : 1;
      const isActiveB = b.properties.isactive === 1 ? 0 : 1;
      return isActiveA - isActiveB;
    });
  }, [groupedEvents]);


  useEffect(() => {
    if (selectedId) {
      const event = eventRefs.current[selectedId];
      if (event) {
        event.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedId]);

  const formatEventDates = (startDate: string, endDate?: string) => {
    const start = format(new Date(startDate), 'MMM d, yyyy');
    if (!endDate) return start;

    const end = format(new Date(endDate), 'MMM d, yyyy');
    return (
      <span className="display-flex flex-align-center">
        {start} <span className="margin-x-05">→</span> {end}
      </span>
    );
  };

  const getEventEndDate = (fireId: string) => {
    const events = features.filter(f => f.properties.fireid.toString() === fireId);
    if (events.length === 0) return null;

    const dates = events.map(e => new Date(e.properties.t).getTime());
    const latestTime = Math.max(...dates);
    return new Date(latestTime).toISOString();
  };

  if (features.length === 0) {
    return (
      <div className="display-flex flex-align-center flex-justify-center height-full padding-4 text-center text-base-light">
        <div>
          <div className="margin-bottom-2 font-sans-lg opacity-50">⚠️</div>
          <p>No fire events found in the selected time range.</p>
          <p className="font-sans-3xs margin-top-2">Try adjusting the time range or filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={listRef} className="overflow-auto" style={{ backgroundColor: "transparent" }}>
      <div className="margin-bottom-2">
      <div className="width-full bg-white radius-md border-0 overflow-hidden">
        <div className="display-flex flex-row height-full">
          <div className="flex-fill display-flex flex-column flex-align-center flex-justify-center padding-y-2 border-right border-base-lighter">
            <div className="text-base-dark font-sans-sm margin-bottom-05">Total</div>
            <div className="font-sans-xl text-bold text-base-dark">{totalEvents}</div>
          </div>
          <div className="flex-fill display-flex flex-column flex-align-center flex-justify-center padding-y-2 border-right border-base-lighter">
            <div className="text-error font-sans-sm margin-bottom-05">Active</div>
            <div className="font-sans-xl text-bold text-error">{activeEvents}</div>
          </div>
          <div className="flex-fill display-flex flex-column flex-align-center flex-justify-center padding-y-2">
            <div className="text-base-dark font-sans-sm margin-bottom-05">Inactive</div>
            <div className="font-sans-xl text-bold text-base-dark">{inactiveEvents}</div>
          </div>
        </div>
      </div>
      </div>

      <div className="bg-base-lighter padding-2 radius-md">
      {sortedGroupedEvents.map((event) => {
        const isActive = event.properties.isactive === 1;
        const isSelected = event.properties.fireid === selectedId;
        const fireId = event.properties.fireid.toString();
        const eventName = event.properties.name || `Fire Event ${fireId}`;
        const area = event.properties.farea?.toFixed(1) || '0.0';
        const frp = event.properties.meanfrp?.toFixed(2) || '0.00';
        const startDate = event.properties.t;
        const endDate = getEventEndDate(fireId);

        return (
          <div
            key={event.properties.fireid}
            ref={el => eventRefs.current[event.properties.fireid] = el}
            onClick={() => {
              onSelectFeature(event.properties.fireid);
            }}
            className={`bg-white margin-bottom-2 radius-md cursor-pointer hover:shadow-2 ${
              isSelected ? 'border-2px border-primary' : ''
            }`}
          >
            <div className="padding-3">
              <div className="display-flex flex-align-center margin-bottom-1">
                {isActive ? (
                  <span className="margin-right-1 text-error">
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 16c3.314 0 6-2.686 6-6 0-3.314-2.686-6-6-6-3.314 0-6 2.686-6 6 0 3.314 2.686 6 6 6z" fill="none" />
                      <path d="M10.8 3.9c-.4-.4-1.1-.4-1.4 0-.3.3-.4.6-.4 1 0 .5.4 1.1.8 1.7.4.6.8 1.2.8 1.7 0 .4-.1.7-.4 1-.3.3-.6.4-1 .4-.8 0-1.5-.6-1.5-1.5 0-.4.1-.7.4-1 .3-.3.4-.6.4-1 0-.5-.4-1.1-.8-1.7-.4-.6-.8-1.2-.8-1.7 0-.4.1-.7.4-1 .3-.3.6-.4 1-.4.8 0 1.5.6 1.5 1.5zM8 13.5c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z" />
                    </svg>
                  </span>
                ) : (
                  <span className="margin-right-1 text-base-dark">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M14.5 4.5c-2.5 0-4.5 2-4.5 4.5 0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5-2-4.5-4.5-4.5zm0 7c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zM6.5 6.5c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm0-5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM5.5 20c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0-3c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zM16 18c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0-3c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" />
                    </svg>
                  </span>
                )}
                <span className={`font-sans-md font-semibold flex-fill ${isActive ? 'text-error' : 'text-base-dark'}`}>
                  {eventName}
                </span>
              </div>

              <div className="font-sans-3xs text-base-dark margin-bottom-2">
                {formatEventDates(startDate, endDate)}
              </div>

              <div className="display-flex flex-row margin-top-2 gap-1">
                <div className="bg-base-dark text-white font-sans-3xs padding-y-05 padding-x-1 radius-sm">
                  {area} km²
                </div>
                <div className="bg-base-dark text-white font-sans-3xs padding-y-05 padding-x-1 radius-sm margin-left-1">
                  {frp} MW
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default EventList;