import React from "react";
import DonutChart from "./donut-chart";

const calculateRingSize = ({
  size = 96,
  width = 20,
  gap = 4,
  index,
  total,
}) => {
  const position = total - index;
  return size + position * width * 2 + gap * position * 2;
};

export default function RingChart({
  size = 96,
  gap = 4,
  width = 20,
  className = "",
  rings = [],
  children,
}) {
  const totalWidth = calculateRingSize({
    size,
    width,
    gap,
    index: 0,
    total: rings.length,
  });

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        minWidth: totalWidth + gap * rings.length * 4,
        minHeight: totalWidth + gap * rings.length * 4,
      }}
    >
      {rings.map((ring, index) => {
        const ringSize = calculateRingSize({
          size,
          width,
          gap,
          index,
          total: rings.length,
        });
        return (
          <DonutChart
            key={`ring_${index}`}
            size={ringSize}
            {...ring}
            progressWidth={width}
            circleWidth={width}
            className={`absolute ${ring.className || ""}`}
          />
        );
      })}
      {/* Absolute center element */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {children}
      </div>
    </div>
  );
}
