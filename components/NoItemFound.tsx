import React from "react";

const NoItemFound: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 0",
        height: "100%", // adjust if needed to center vertically in parent
        textAlign: "center",
      }}
    >
      <img
        src="/images/no-item.PNG" 
        alt="No item found"
        style={{ width: 150, height: 150, marginBottom: 16 }}
      />
      <p style={{ color: "#6b7280", fontSize: "1.125rem", fontWeight: 500 }}>
        No item found
      </p>
    </div>
  );
};

export default NoItemFound;
