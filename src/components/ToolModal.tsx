import React from 'react';
import { Modal, ModalRef, Tag, Button } from '@trussworks/react-uswds';

interface FireModalProps {
  modalRef: React.RefObject<ModalRef>;
  showModal: boolean;
  handleCloseModal: () => void;
  today: string;
}

const FireModal: React.FC<FireModalProps> = ({
  modalRef,
  showModal,
  handleCloseModal,
  today,
}) => {
  return (
    <Modal
      id="fire-modal"
      className="wildfire-explorer__modal usa-modal--lg bg-base-lightest shadow-3 padding-5 radius-0"
      ref={modalRef}
      modalIsOpen={showModal}
      aria-describedby="fire-modal-description"
      aria-labelledby="fire-modal-heading"
    >
      <div className="wildfire-explorer__modal-content usa-modal__content">
        <Button
          type="button"
          unstyled
          className="position-absolute"
          style={{ top: '20px', right: '20px' }}
          onClick={handleCloseModal}
          aria-label="Close modal"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
              fill="#71767A"
            />
          </svg>
        </Button>

        <div className="wildfire-explorer__modal-main usa-modal__main">
          <div className="display-flex flex-align-center margin-bottom-3">
            <img
              src="https://earthdata.nasa.gov/dashboard/NASA_logo.svg"
              alt="NASA Logo"
              className="height-4 margin-right-2"
              aria-hidden="false"
            />
            <span className="font-public-sans font-sans-md text-base">
              Earthdata VEDA Dashboard
            </span>
          </div>

          <h1
            className="font-heading-xl text-ink margin-0 margin-bottom-2"
            id="fire-modal-heading"
          >
            Fire Event Explorer
          </h1>

          <Tag className="border-radius-sm" background="#71767A">
            Last updated: {today} UTC
          </Tag>

          <p className="wildfire-explorer__modal-description font-sans-sm line-height-body-5 text-ink">
            This tool visualizes near real-time (NRT) satellite-based fire
            perimeters, active portions of fire perimeters (fire lines), and
            active fire pixel detections for the current year.
          </p>

          <p className="wildfire-explorer__modal-description font-sans-sm line-height-body-5 text-ink">
            Use the bottom panel to select different date ranges or subset fires
            by size, duration, or intensity. Click on an individual fire to
            visualize the time series of fire growth every 12 hours and create
            video outputs in GIF or WebM formats.
          </p>

          <p className="wildfire-explorer__modal-description font-sans-sm line-height-body-5 text-ink margin-bottom-1">
            These fire tracking data are from the Fire Event Data Suite (FEDS)
            algorithm. Find out more:
          </p>

          <ul className="wildfire-explorer__modal-list usa-list font-sans-sm margin-top-0 margin-bottom-4">
            <li>
              <a
                href="https://earth-information-system.github.io/fireatlas/docs/nrt.html#accessing-nrt-data"
                className="text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                FEDS data source documentation
              </a>
            </li>
            <li>
              <a
                href="https://docs.openveda.cloud/user-guide/notebooks/tutorials/mapping-fires.html#collection-information"
                className="text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenVEDA documentation
              </a>
            </li>
            <li>
              <a
                href="https://www.earthdata.nasa.gov/dashboard/"
                className="text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Earthdata VEDA dashboard
              </a>
            </li>
          </ul>

          <div className="display-flex flex-justify flex-align-center">
            <div className="display-flex flex-align-center">
              <input
                type="checkbox"
                id="dont-show-again"
                className="usa-checkbox__input"
                onChange={(e) =>
                  localStorage.setItem(
                    'hideFireModal',
                    e.target.checked ? 'true' : 'false'
                  )
                }
              />
              <label
                htmlFor="dont-show-again"
                className="usa-checkbox__label font-sans-sm text-ink"
              >
                Don't show again
              </label>
            </div>

            <Button
              type="button"
              className="display-flex flex-align-center radius-md font-ui font-weight-bold font-2xs line-height-1 text-center text-bottom padding-y-105 padding-x-205"
              onClick={handleCloseModal}
            >
              Explore tool
              <svg
                className="margin-left-1"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M4 12H20M20 12L14 6M20 12L14 18"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </Button>
          </div>

          <h2>Frequently Asked Questions</h2>

          <h3>Q: What is NRT?</h3>
          <p>
            A: Near real-time (NRT) refers to data available 1 to 3 hours after
            an observation by an instrument aboard a space-based platform. FEDS
            data utilize NRT observations from the Visible Infrared Imaging
            Radiometer Suite (VIIRS) sensors. FEDS data update periodically each
            day based on new VIIRS observations within a few hours of initial
            satellite observation.
          </p>

          <h3>Q: What are the layers?</h3>
          <p>
            The <b>Fire Perimeters</b> layer shows the estimated fire-affected
            area as detected by the VIIRS sensor. The <b>Active Fire Front</b>{' '}
            layer shows the portion of the perimeter where active burning is
            detected. The <b>Fire Detections</b> layer shows the individual
            VIIRS pixel detections representing active fire activity.
          </p>

          <h3>Q: What can you do with this tool?</h3>
          <p>
            You can look at active fire perimeters from the start of the
            calendar year up to today. By clicking on an individual fire
            perimeter, you can see its progression history in more detail,
            including how it spread over terrain and changed with wind
            direction. You can also save a movie or GIF showing its lifetime
            spread.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default FireModal;
