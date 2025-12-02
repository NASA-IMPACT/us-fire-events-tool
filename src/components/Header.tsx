import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  ModalRef,
  ModalToggleButton,
  Tag,
  SiteAlert
} from '@trussworks/react-uswds';

import './header.scss';

const Header: React.FC = () => {
  const modalRef = useRef<ModalRef>(null);
  const [showModal, setShowModal] = useState(() => {
    return localStorage.getItem('hideFireModal') !== 'true';
  });

  useEffect(() => {
    if (showModal) {
      modalRef.current?.toggleModal(undefined, true);
    }
  }, [showModal]);

  const handleCloseModal = () => {
    localStorage.setItem('hideFireModal', 'true');
    modalRef.current?.toggleModal(undefined, false);
    setShowModal(false);
  };

  const today = new Date();
  const isAfterNoon = today.getUTCHours() >= 12;
  const adjustedDate = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      isAfterNoon ? 12 : 0
    )
  );
  const formattedDate = adjustedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
    timeZone: 'UTC',
  });

  return (
    <>
      <header className="header bg-white height-5 padding-y-05 padding-x-105 display-flex flex-row  tablet:flex-justify-between flex-align-center width-full position-fixed top-0 left-0 z-top">
      <div className="display-flex flex-align-center width-full tablet:flex-justify-start flex-justify">
        <a
          href="https://earthdata.nasa.gov/dashboard"
          className="display-flex flex-align-center text-no-underline"
        >
          <img
            src="https://earthdata.nasa.gov/dashboard/NASA_logo.svg"
            alt="NASA Logo"
            className="height-4 margin-right-2"
            aria-hidden="false"
          />
          <span className="font-public-sans font-sans-2xs font-weight-bold text-base margin-right-2 display-none tablet:display-block ">
            Earthdata VEDA Dashboard
          </span>
        </a>
        <span className="font-public-sans font-sans-xs font-weight-bold text-ink margin-0 margin-right-1">
          Fire Event Explorer
        </span>
        <ModalToggleButton
          className="usa-button usa-button--unstyled"
          modalRef={modalRef}
          opener
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M9.16663 5.83317H10.8333V7.49984H9.16663V5.83317ZM9.16663 9.1665H10.8333V14.1665H9.16663V9.1665ZM9.99996 1.6665C5.39996 1.6665 1.66663 5.39984 1.66663 9.99984C1.66663 14.5998 5.39996 18.3332 9.99996 18.3332C14.6 18.3332 18.3333 14.5998 18.3333 9.99984C18.3333 5.39984 14.6 1.6665 9.99996 1.6665ZM9.99996 16.6665C6.32496 16.6665 3.33329 13.6748 3.33329 9.99984C3.33329 6.32484 6.32496 3.33317 9.99996 3.33317C13.675 3.33317 16.6666 6.32484 16.6666 9.99984C16.6666 13.6748 13.675 16.6665 9.99996 16.6665Z"
              fill="#71767A"
            />
          </svg>
        </ModalToggleButton>
      </div>

      <Modal
        id="fire-modal"
        className="wildfire-explorer__modal usa-modal--lg bg-base-lightest shadow-3 padding-5 radius-0"
        ref={modalRef}
        aria-describedby="fire-modal-description"
        aria-labelledby="fire-modal-heading"
      >
        <div className="wildfire-explorer__modal-content usa-modal__content">
          <button
            className="usa-button usa-button--unstyled position-absolute"
            style={{ top: '20px', right: '20px' }}
            onClick={handleCloseModal}
            aria-label="Close modal"
            type="button"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                fill="#71767A"
              />
            </svg>
          </button>
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
              Last updated: {formattedDate}
            </Tag>

            <p className="wildfire-explorer__modal-description font-sans-sm line-height-body-5 text-ink">
              This tool visualizes near real-time (NRT) satellite-based fire
              perimeters, active portions of fire perimeters (fire lines), and
              active fire pixel detections for the current year.
            </p>

            <p className="wildfire-explorer__modal-description font-sans-sm line-height-body-5 text-ink">
              Use the bottom panel to select different date ranges or subset
              fires by size, duration, or intensity. Click on an individual fire
              to visualize the time series of fire growth every 12 hours and
              create video outputs in GIF or WebM formats.
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

              <button
                className="usa-button display-flex flex-align-center radius-md font-ui font-weight-bold font-2xs line-height-1 text-center text-bottom padding-y-105 padding-x-205"
                onClick={handleCloseModal}
              >
                Explore tool
                <svg
                  className="margin-left-1"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12H20M20 12L14 6M20 12L14 18"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>

            <h2>Frequently Asked Questions</h2>

            <h3>Q: What is NRT?</h3>
            <p>
              A: Near real-time (NRT) refers to data available 1 to 3 hours
              after an observation by an instrument aboard a space-based
              platform. FEDS data utilize NRT observations from the Visible
              Infrared Imaging Radiometer Suite (VIIRS) sensors. FEDS data
              update periodically each day based on new VIIRS observations
              within a few hours of initial satellite observation.
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
    </header>
    </>
  );
};

export default Header;
