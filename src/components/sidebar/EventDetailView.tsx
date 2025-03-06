import { useCallback } from 'react';
import { format } from 'date-fns';
import { EventFeature } from '../../types/events';
import { ArrowLeft, HelpCircle } from 'lucide-react';

interface EventDetailViewProps {
  event: EventFeature | null;
  onBack: () => void;
}

const EventDetailView: React.FC<EventDetailViewProps> = ({ event, onBack }) => {
  if (!event) return null;

  const {
    name,
    fireid,
    t,
    farea,
    duration,
    meanfrp,
    fperim,
    isactive,
    n_pixels,
    pixel_density,
    new_pixels
  } = event.properties;

  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  }, []);

  const getEndDate = useCallback((startDate: string, days: number) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return format(date, 'MMM d, yyyy');
  }, []);

  const startDate = formatDate(t);
  const endDate = duration ? getEndDate(t, duration) : startDate;

  const eventName = name || `Fire Event ${fireid}`;

  return (
    <div className="bg-white width-full height-full overflow-y-auto">
      <div className="padding-y-05 padding-x-2 border-bottom border-base-lighter">
        <button
          onClick={onBack}
          className="display-flex flex-align-center text-primary font-sans-micro border-0 bg-transparent cursor-pointer"
        >
          <ArrowLeft size={14} className="margin-right-05" />
          Back to all fire events
        </button>
      </div>

      <div className="padding-x-2 padding-top-1">
        <div className="display-flex flex-align-center margin-bottom-05">
          <h1 className={`font-sans-md text-bold margin-0 flex-fill ${isactive ? "text-error" : "text-base-dark"}`}>
            {eventName}
          </h1>
        </div>

        <div className="font-sans-2xs text-base-dark margin-bottom-1">
          {startDate} <span className="margin-x-05">→</span> {endDate}
        </div>

        <div className="grid-row grid-gap-1 margin-bottom-1">
          <div className="grid-col-6 margin-bottom-05">
            <div className="border-1px border-base-lighter radius-md padding-1">
              <div className="text-base-dark font-sans-micro margin-bottom-05">Area</div>
              <div className="display-flex flex-align-end">
                <span className="font-sans-lg text-bold margin-right-05">
                  {farea ? Number(farea).toFixed(2) : "0.00"}
                </span>
                <span className="font-sans-micro text-base-dark">km²</span>
              </div>
            </div>
          </div>

          <div className="grid-col-6 margin-bottom-05">
            <div className="border-1px border-base-lighter radius-md padding-1">
              <div className="text-base-dark font-sans-micro margin-bottom-05">Duration</div>
              <div className="display-flex flex-align-end">
                <span className="font-sans-lg text-bold margin-right-05">
                  {duration ? Number(duration).toFixed(1) : "0.0"}
                </span>
                <span className="font-sans-micro text-base-dark">days</span>
              </div>
            </div>
          </div>

          <div className="grid-col-6 margin-bottom-05">
            <div className="border-1px border-base-lighter radius-md padding-1">
              <div className="display-flex flex-align-center">
                <span className="text-base-dark font-sans-micro margin-bottom-05 flex-fill">Mean RFP</span>
                <HelpCircle size={12} color="#71767a" />
              </div>
              <div className="display-flex flex-align-end">
                <span className="font-sans-lg text-bold margin-right-05">
                  {meanfrp ? Number(meanfrp).toFixed(2) : "0.00"}
                </span>
                <span className="font-sans-micro text-base-dark">MW</span>
              </div>
            </div>
          </div>

          <div className="grid-col-6 margin-bottom-05">
            <div className="border-1px border-base-lighter radius-md padding-1">
              <div className="text-base-dark font-sans-micro margin-bottom-05">Perimeter</div>
              <div className="display-flex flex-align-end">
                <span className="font-sans-lg text-bold margin-right-05">
                  {fperim ? Number(fperim).toFixed(2) : "0.00"}
                </span>
                <span className="font-sans-micro text-base-dark">km</span>
              </div>
            </div>
          </div>
        </div>

        <div className="margin-top-1">
          <div className="border-top border-base-lighter width-full">
            <div className="display-flex flex-justify border-bottom border-base-lighter padding-y-1">
              <span className="font-sans-2xs text-bold">Status</span>
              <span className={`radius-sm font-sans-micro padding-y-01 padding-x-05 ${isactive ? "bg-error" : "bg-base-dark"} text-white`}>
                {isactive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="display-flex flex-justify border-bottom border-base-lighter padding-y-1">
              <span className="font-sans-2xs text-bold">Pixel density</span>
              <span className="font-sans-2xs">
                {pixel_density ? Number(pixel_density).toFixed(2) : "0.00"} px/km²
              </span>
            </div>
            <div className="display-flex flex-justify border-bottom border-base-lighter padding-y-1">
              <span className="font-sans-2xs text-bold">New pixels</span>
              <span className="font-sans-2xs">
                {new_pixels || "0"}
              </span>
            </div>
            <div className="display-flex flex-justify border-bottom border-base-lighter padding-y-1">
              <span className="font-sans-2xs text-bold">Total pixels</span>
              <span className="font-sans-2xs">
                {n_pixels || "0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailView;