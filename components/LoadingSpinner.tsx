import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        padding: "2rem",
      }}
      aria-label="Loading"
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "4px solid #ccc",
          borderTop: "4px solid purple", // blue color
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
