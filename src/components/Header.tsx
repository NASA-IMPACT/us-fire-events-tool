import React, { useEffect, useRef, useState } from 'react';
import { ModalRef, ModalToggleButton } from '@trussworks/react-uswds';
import ToolModal from './ToolModal';

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
    <header className="header bg-white height-5 padding-y-05 padding-x-105 display-flex flex-row flex-justify-between flex-align-center width-full position-fixed top-0 left-0 z-top">
      <div className="display-flex flex-align-center">
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
          <span className="font-public-sans font-sans-2xs font-weight-bold text-base margin-right-2">
            Earthdata VEDA Dashboard
          </span>
        </a>
        <span className="font-public-sans font-sans-xs font-weight-bold text-ink margin-0 margin-right-1">
          Fire Event Explorer
        </span>
      </div>

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
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.16663 5.83317H10.8333V7.49984H9.16663V5.83317ZM9.16663 9.1665H10.8333V14.1665H9.16663V9.1665ZM9.99996 1.6665C5.39996 1.6665 1.66663 5.39984 1.66663 9.99984C1.66663 14.5998 5.39996 18.3332 9.99996 18.3332C14.6 18.3332 18.3333 14.5998 18.3333 9.99984C18.3333 5.39984 14.6 1.6665 9.99996 1.6665ZM9.99996 16.6665C6.32496 16.6665 3.33329 13.6748 3.33329 9.99984C3.33329 6.32484 6.32496 3.33317 9.99996 3.33317C13.675 3.33317 16.6666 6.32484 16.6666 9.99984C16.6666 13.6748 13.675 16.6665 9.99996 16.6665Z"
            fill="#71767A"
          />
        </svg>
      </ModalToggleButton>

      <ToolModal
        modalRef={modalRef}
        modalIsOpen={showModal}
        onClose={handleCloseModal}
        today={formattedDate}
      />
    </header>
  );
};

export default Header;
