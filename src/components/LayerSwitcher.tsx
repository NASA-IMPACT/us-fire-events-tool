import { useAppState } from '../contexts/AppStateContext';
import { Eye, EyeOff, X } from 'lucide-react';

type LayerSwitcherProps = {
  onClose: () => void;
};

const LayerSwitcher: React.FC<LayerSwitcherProps> = ({ onClose }) => {
  const {
    showPerimeterNrt,
    showFireline,
    showNewFirepix,
    setShowPerimeterNrt,
    setShowFireline,
    setShowNewFirepix
  } = useAppState();

  const layerItem = (
    label: string,
    visible: boolean,
    toggle: () => void,
    disabled = false,
    isLast = false
  ) => (
    <div
      onClick={toggle}
      className={`group display-flex flex-justify align-items-center ${
        isLast ? '' : 'margin-bottom-1'
      }`}
      style={{ cursor: 'pointer' }}
    >
      <span
        className={`font-sans-3xs ${
          !visible || disabled ? 'text-base-lighter' : 'text-base-dark'
        }`}
      >
        {label}
      </span>

      <button
        className={`bg-transparent border-0 cursor-pointer margin-left-1 visibility-hidden group-hover:visibility-visible ${
          !visible || disabled ? 'text-base-lighter' : 'text-base-dark'
        }`}
        disabled={disabled}
        aria-label={`Toggle ${label}`}
      >
        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
    </div>
  );

  return (
    <div className="z-top bg-white padding-x-1 padding-y-1 radius-md shadow-2 border-1px border-base-lighter text-3xs">
      <div className="display-flex flex-justify align-items-center margin-bottom-1">
        <h4 className="margin-0 text-base font-sans-3xs">Available layers</h4>
        <div
          className="bg-transparent border-0 cursor-pointer text-base-dark"
          style={{ marginRight: '5px'}}
          onClick={onClose}
          aria-label="Collapse layer switcher"
        >
          <X size={16} />
        </div>
      </div>

      {layerItem('All perimeters (NRT)', showPerimeterNrt, () => setShowPerimeterNrt(!showPerimeterNrt))}
      {layerItem('Fireline (spread)', showFireline, () => setShowFireline(!showFireline))}
      {layerItem('New fire pixels (uncertainty)', showNewFirepix, () => setShowNewFirepix(!showNewFirepix))}
    </div>
  );
};

export default LayerSwitcher;
