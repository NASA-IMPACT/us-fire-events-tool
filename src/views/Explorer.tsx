import React, { useState } from 'react';
import { useFireExplorerStore } from '@/state/useFireExplorerStore';
import { getDefaultTimeRange } from '../utils/dateUtils';
import MapView from '../components/MapView';
import EventDetails from '../components/sidebar/EventDetailsView';
import DetailedTimeChart from '../components/timeline/DetailedTimeChart';
import DateRangeSelector from '@/components/timeline/DateRangeSelector';
import Header from '../components/Header';
import LayerSwitcher from '../components/LayerSwitcher';
import { Layers } from 'lucide-react';

import 'mapbox-gl/dist/mapbox-gl.css';

type LoadingStates = {
  perimeterNrt: boolean;
  fireline: boolean;
  newfirepix: boolean;
};

const Explorer: React.FC = () => {
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    perimeterNrt: false,
    fireline: false,
    newfirepix: false,
  });

  const viewMode = useFireExplorerStore.use.viewMode();
  const setViewMode = useFireExplorerStore.use.setViewMode();
  const toggle3DMap = useFireExplorerStore.use.toggle3DMap();
  const show3DMap = useFireExplorerStore.use.show3DMap();
  const windLayerType = useFireExplorerStore.use.windLayerType();
  const setWindLayerType = useFireExplorerStore.use.setWindLayerType();
  const showPerimeterNrt = useFireExplorerStore.use.showPerimeterNrt();
  const showFireline = useFireExplorerStore.use.showFireline();
  const showNewFirepix = useFireExplorerStore.use.showNewFirepix();
  const selectedEventId = useFireExplorerStore.use.selectedEventId();
  const selectEvent = useFireExplorerStore.use.selectEvent();
  const setTimeRange = useFireExplorerStore.use.setTimeRange();

  const handleBackToList = () => {
    selectEvent(null);
    setViewMode('explorer');

    if (show3DMap) {
      toggle3DMap();
    }

    if (windLayerType !== null) {
      setWindLayerType(null);
    }

    const defaultRange = getDefaultTimeRange();
    setTimeRange(defaultRange);
  };

  const handleLoadingStatesChange = (newLoadingStates: LoadingStates) => {
    setLoadingStates(newLoadingStates);
  };

  const hasLoadingLayers = Object.entries(loadingStates).some(
    ([layerKey, isLoading]) => {
      if (!isLoading) return false;

      switch (layerKey) {
        case 'perimeterNrt':
          return showPerimeterNrt;
        case 'fireline':
          return showFireline;
        case 'newfirepix':
          return showNewFirepix;
        default:
          return false;
      }
    }
  );

  return (
    <div className="wildfire-explorer">
      <Header />

      <div className="display-flex height-viewport">
        <div className="position-relative flex-fill">
          {viewMode !== 'detail' && (
            <div
              className="display-flex position-absolute z-top bg-white border-0 shadow-2 radius-md cursor-pointer"
              style={{
                top: '50px',
                right: '10px',
                transition: 'right 0.2s ease',
                padding: '5px 5px 2px 5px',
              }}
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              aria-label="Toggle layer switcher"
            >
              <div className="position-relative">
                <Layers size={18} />

                {hasLoadingLayers && (
                  <div
                    className="position-absolute"
                    style={{
                      width: '6px',
                      height: '6px',
                      top: '0px',
                      right: '0px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1.5s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {showLayerPanel && viewMode !== 'detail' && (
            <div
              className="position-absolute z-top"
              style={{
                top: '50px',
                right: '10px',
                transition: 'right 0.2s ease',
              }}
            >
              <LayerSwitcher
                onClose={() => setShowLayerPanel(false)}
                loadingStates={loadingStates}
              />
            </div>
          )}

          <MapView onLoadingStatesChange={handleLoadingStatesChange} />

          {viewMode === 'detail' && selectedEventId ? (
            <div
              className="position-absolute bottom-0 z-top margin-bottom-2"
              style={{
                left: 'calc(50% - 185px)',
                transform: 'translateX(-50%)',
              }}
            >
              <DetailedTimeChart />
            </div>
          ) : (
            <div
              className="position-absolute bottom-0 z-top margin-bottom-2"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            >
              <DateRangeSelector />
            </div>
          )}
        </div>

        {viewMode === 'detail' && (
          <div
            className="overflow-hidden display-flex flex-column position-absolute bg-white"
            style={{
              position: 'absolute',
              width: '360px',
              top: '50px',
              right: '10px',
              height: 'calc(100% - 66px)',
            }}
          >
            <EventDetails onBack={handleBackToList} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
