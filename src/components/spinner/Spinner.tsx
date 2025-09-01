import React from "react";
import "./Spinner.scss";
import type { SpinnerProps } from "../../Interface";





const Spinner: React.FC<SpinnerProps> = ({
  variant = "ring",
  size = "md",
  color,
  accent,
  modal = false,
  label,
}) => {
  const style: React.CSSProperties = {
    ...(color && { ["--spn-color" as any]: color }),
    ...(accent && { ["--spn-accent" as any]: accent }),
  };

  const spinner = variant === "dots" ? (
    <div className={`spinner spinner--${size} spinner--dots`} style={style}>
      <div className="dot" /><div className="dot" /><div className="dot" />
    </div>
  ) : (
    <div className={`spinner spinner--${size} spinner--ring`} style={style}>
      <svg viewBox="0 0 50 50" aria-label="Loading">
        <defs>
          <linearGradient id="spnGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--spn-accent)" />
            <stop offset="100%" stopColor="var(--spn-color)" />
          </linearGradient>
        </defs>
        <circle className="track" cx="25" cy="25" r="20" fill="none" />
        <circle className="arc"   cx="25" cy="25" r="20" fill="none" />
      </svg>
    </div>
  );

  if (!modal) return spinner;

  return (
    <div className="spinner-modal">
      <div className="spinner-card">
        {spinner}
        {label && <span className="label">{label}</span>}
      </div>
    </div>
  );
};

export default Spinner;


/*
 <Spinner
          variant="dots"
          size="lg"
          modal
          label="Loading, please wait..."
          color="#f43f5e"   // pink
          accent="#22d3ee" // cyan
        />
*/ 