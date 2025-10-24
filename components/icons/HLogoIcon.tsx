import React from 'react';

export const HLogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H8V14H16V21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H16V10H8V3H5ZM8 12V5H16V12H8Z"
    />
  </svg>
);