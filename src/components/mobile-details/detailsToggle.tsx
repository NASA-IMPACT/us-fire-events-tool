import React, { useEffect } from 'react';
import { Button } from '@trussworks/react-uswds';

interface DetailsToggle {
  setMobileTimelineActive: any;
  mobileTimelineActive: boolean;
}

const DetailsToggle = ({
  setMobileTimelineActive,
  mobileTimelineActive,
}: DetailsToggle) => {
  useEffect(() => {}, [mobileTimelineActive]);
  return (
    <div className="widsht-full display-flex padding-05 border-1px border-base-light radius-md grid-gap-lg">
      <Button
        type="button"
        outline={mobileTimelineActive == true ? false : true}
        className={`width-full  ${
          mobileTimelineActive == true ? '' : 'text-base-light shadow-none'
        }`}
        title="Timeline"
        onClick={() => setMobileTimelineActive(!mobileTimelineActive)}
      >
        Timeline
      </Button>
      <Button
        type="button"
        onClick={() => setMobileTimelineActive(!mobileTimelineActive)}
        className={`width-full  margin-0  ${
          mobileTimelineActive == true ? 'text-base-light shadow-none' : ''
        }`}
        title="Fire Details"
        outline={mobileTimelineActive == true ? true : false}
      >
        Fire Details
      </Button>
    </div>
  );
};

export default DetailsToggle;
