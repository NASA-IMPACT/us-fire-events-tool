import { useMemo, useEffect, useRef, memo } from 'react';
import { format } from 'date-fns';
import { useAppState } from '../../contexts/AppStateContext';
import { MVTFeature, getFeatureProperties, getFeatureGeometry, isFeatureActive, getFireId, useEvents } from '../../contexts/EventsContext';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

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
  features: MVTFeature[];
}

const EventItem = memo(({ event, onClick, formatEventDates, getEventEndDate, features }) => {
  const { selectEvent } = useEvents();
  const { setViewMode } = useAppState();

  const props = getFeatureProperties(event);
  const isActive = isFeatureActive(event);
  const fireId = getFireId(event);
  const eventName = props.name || `Fire Event ${fireId}`;
  const area = props.farea?.toFixed(1) || '0.0';
  const frp = props.meanfrp?.toFixed(2) || '0.00';
  const startDate = props.t;
  const endDate = getEventEndDate(fireId, features);

  const handleEventClick = () => {
    selectEvent(fireId);
    setViewMode('detail');
  };

  return (
    <div
      onClick={handleEventClick}
      className={`bg-white radius-md cursor-pointer hover:shadow-2`}
    >
      <div className="padding-3">
        <div className="display-flex flex-align-center margin-bottom-1">
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
});

const getEventEndDate = (fireId: string, features: MVTFeature[]) => {
  const events = features.filter(f => getFireId(f) === fireId);
  if (events.length === 0) return null;

  const dates = events.map(e => {
    const props = getFeatureProperties(e);
    return new Date(props.t || '').getTime();
  }).filter(time => !isNaN(time));

  if (dates.length === 0) return null;

  const latestTime = Math.max(...dates);
  return new Date(latestTime).toISOString();
};

const formatEventDates = (startDate: string, endDate?: string) => {
  if (!startDate) return 'Unknown date';

  const start = format(new Date(startDate), 'MMM d, yyyy');
  if (!endDate) return start;

  const end = format(new Date(endDate), 'MMM d, yyyy');
  return (
    <span className="display-flex flex-align-center">
      {start} <span className="margin-x-05">→</span> {end}
    </span>
  );
};

const EventList: React.FC<EventListProps> = memo(({ features }) => {
  const listRef = useRef<FixedSizeList>(null);
  const { mapBounds } = useAppState();
  const prevFeaturesLengthRef = useRef(features.length);

  useEffect(() => {
    if (prevFeaturesLengthRef.current !== features.length) {
      prevFeaturesLengthRef.current = features.length;
    }
  }, [features.length]);

  const { totalEvents, activeEvents, inactiveEvents } = useMemo(() => {
    const active = features.filter(f => isFeatureActive(f));
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
      const geometry = getFeatureGeometry(event);
      if (geometry.type !== 'Polygon') return false;

      const outerRing = geometry.coordinates[0];
      if (!outerRing) return false;

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
      const fireId = getFireId(feature);
      if (!fireId) return;

      if (!uniqueEvents.has(fireId) || isFeatureActive(feature)) {
        uniqueEvents.set(fireId, feature);
      }
    });

    return Array.from(uniqueEvents.values());
  }, [filteredFeatures]);

  const sortedGroupedEvents = useMemo(() => {
    return [...groupedEvents].sort((a, b) => {
      const isActiveA = isFeatureActive(a) ? 0 : 1;
      const isActiveB = isFeatureActive(b) ? 0 : 1;
      return isActiveA - isActiveB;
    });
  }, [groupedEvents]);

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

  const renderRow = ({ index, style }) => {
    const event = sortedGroupedEvents[index];

    return (
      <div style={style}>
      <div className='padding-1'>
        <EventItem
          event={event}
          formatEventDates={formatEventDates}
          getEventEndDate={getEventEndDate}
          features={features}
        />
      </div>
    </div>
    );
  };

  return (
    <div className="display-flex flex-column height-full">
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

      <div className="bg-base-lighter radius-md flex-fill">
          <div className="height-full">
            <AutoSizer>
              {({ height, width }) =>
              <FixedSizeList
                ref={listRef}
                height={height}
                width={width}
                itemCount={sortedGroupedEvents.length}
                itemSize={140}
                overscanCount={5}
              >
                {renderRow}
              </FixedSizeList>
              }
            </AutoSizer>
          </div>
      </div>
    </div>
  );
});

export default EventList;