import React from "react";

export default function DonutChart({
  size,
  progress,
  color,
  trackColor,
  circleWidth = 16,
  progressWidth = 16,
  rounded = true,
  className = "",
  children,
}) {
  const radius = size / 2 - Math.max(progressWidth, circleWidth) / 2;
  const circumference = Math.PI * radius * 2;
  const percentage = circumference * ((100 - progress) / 100);

  return (
    <div className={className}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          r={radius}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          stroke={trackColor || "rgba(0,0,0,0.05)"}
          strokeWidth={`${circleWidth}px`}
          strokeDasharray={"10px 0"}
          strokeDashoffset="0px"
          className="duration-500 transition-all"
        />
        <circle
          r={radius}
          cx={size / 2}
          cy={size / 2}
          stroke={color || "currentColor"}
          className="duration-500 transition-all"
          strokeWidth={`${progressWidth}px`}
          strokeLinecap={rounded ? "round" : "butt"}
          fill="transparent"
          strokeDasharray={`${circumference}px`}
          strokeDashoffset={`${percentage}px`}
        />
      </svg>
      {children}
    </div>
  );
}
