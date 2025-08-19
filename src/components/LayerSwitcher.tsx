import { useFireExplorerStore } from '@/state/useFireExplorerStore';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { Button } from '@trussworks/react-uswds';
import React from 'react';
import './layer-switcher.scss';

type LayerSwitcherProps = {
  onClose: () => void;
  loadingStates?: {
    perimeterNrt?: boolean;
    fireline?: boolean;
    newfirepix?: boolean;
  };
};

const LayerItem: React.FC<{
  label: string;
  visible: boolean;
  toggle: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  isLast?: boolean;
}> = ({
  label,
  visible,
  toggle,
  isLoading = false,
  disabled = false,
  isLast = false,
}) => (
  <div
    onClick={toggle}
    className={`layer-item display-flex flex-justify align-items-center ${
      isLast ? '' : 'margin-bottom-1'
    }`}
    style={{ cursor: 'pointer' }}
  >
    <div className="display-flex align-items-center">
      <span
        className={`font-sans-3xs ${
          !visible || disabled ? 'text-base-lighter' : 'text-base-dark'
        }`}
      >
        {label}
      </span>

      {visible && isLoading && (
        <div className="margin-left-1">
          <Loader2
            size={12}
            className="spin text-blue-500"
            aria-label="Loading tiles"
          />
        </div>
      )}
    </div>

    <Button
      type="button"
      unstyled
      className={`margin-left-1 visibility-hidden group-hover:visibility-visible ${
        !visible || disabled ? 'text-base-lighter' : 'text-base-dark'
      }`}
      disabled={disabled}
      aria-label={`Toggle ${label}`}
    >
      {visible ? <Eye size={14} /> : <EyeOff size={14} />}
    </Button>
  </div>
);

const LayerSwitcher: React.FC<LayerSwitcherProps> = ({
  onClose,
  loadingStates = {},
}) => {
  const showPerimeterNrt = useFireExplorerStore.use.showPerimeterNrt();
  const showFireline = useFireExplorerStore.use.showFireline();
  const showNewFirepix = useFireExplorerStore.use.showNewFirepix();

  const setShowPerimeterNrt = useFireExplorerStore.use.setShowPerimeterNrt();
  const setShowFireline = useFireExplorerStore.use.setShowFireline();
  const setShowNewFirepix = useFireExplorerStore.use.setShowNewFirepix();

  return (
    <>
      <div className="mobile-lg:display-block display-none layer-switcher z-top bg-white padding-x-1 padding-y-1 radius-md shadow-2 border-1px border-base-lighter text-3xs">
        <div className="display-flex flex-justify align-items-center margin-bottom-1">
          <h4 className="margin-0 text-base font-sans-3xs">Available layers</h4>
          <Button
            type="button"
            unstyled
            className="margin-right-05 text-base-dark"
            onClick={onClose}
            aria-label="Collapse layer switcher"
          >
            <X size={16} />
          </Button>
        </div>

        <LayerItem
          label="Fire Perimeters"
          visible={showPerimeterNrt}
          toggle={() => setShowPerimeterNrt(!showPerimeterNrt)}
          isLoading={loadingStates.perimeterNrt}
        />
        <LayerItem
          label="Active Fire Fronts"
          visible={showFireline}
          toggle={() => setShowFireline(!showFireline)}
          isLoading={loadingStates.fireline}
        />
        <LayerItem
          label="Fire Detections"
          visible={showNewFirepix}
          toggle={() => setShowNewFirepix(!showNewFirepix)}
          isLoading={loadingStates.newfirepix}
          isLast
        />
      </div>
      <div className="mobile-lg:display-none display-block layer-switcher z-top bg-white padding-x-1 padding-y-1 radius-md shadow-2 border-1px border-base-lighter text-3xs width-full">
        <div className="display-flex flex-justify align-items-center margin-bottom-1">
          <h4 className="margin-0 text-base mobile-lg:font-sans-3xs font-sans-md">Available layers</h4>

          <Button
            type="button"
            unstyled
            className="margin-right-05 text-base-dark"
            onClick={onClose}
            aria-label="Collapse layer switcher"
          >
            <X size={24} />
          </Button>
        </div>

        <LayerItem
          label="Fire Perimeters"
          visible={showPerimeterNrt}
          toggle={() => setShowPerimeterNrt(!showPerimeterNrt)}
          isLoading={loadingStates.perimeterNrt}
        />
        <LayerItem
          label="Active Fire Fronts"
          visible={showFireline}
          toggle={() => setShowFireline(!showFireline)}
          isLoading={loadingStates.fireline}
        />
        <LayerItem
          label="Fire Detections"
          visible={showNewFirepix}
          toggle={() => setShowNewFirepix(!showNewFirepix)}
          isLoading={loadingStates.newfirepix}
          isLast
        />
      </div>
    </>
  );
};

export default LayerSwitcher;
