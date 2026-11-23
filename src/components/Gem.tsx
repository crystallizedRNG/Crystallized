type Props = {
  color: string;
  size?: number;
  locked?: boolean;
  glow?: boolean;
  className?: string;
};

export default function Gem({ color, size = 96, locked, glow, className }: Props) {
  const fill = locked ? "#1f2037" : "currentColor";
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ color, ...(glow && !locked ? { filter: `drop-shadow(0 0 18px ${color})` } : {}) }}
      aria-hidden
    >
      <polygon points="25,14 75,14 95,38 5,38" fill={fill} />
      <polygon points="5,38 95,38 50,92" fill={fill} />
      {!locked && (
        <>
          <polygon points="25,14 5,38 35,38" fill="#fff" opacity="0.35" />
          <polygon points="25,14 75,14 65,38 35,38" fill="#fff" opacity="0.15" />
          <polygon points="75,14 95,38 65,38" fill="#000" opacity="0.12" />
          <polygon points="5,38 35,38 50,92" fill="#fff" opacity="0.18" />
          <polygon points="35,38 65,38 50,92" fill="#fff" opacity="0.02" />
          <polygon points="65,38 95,38 50,92" fill="#000" opacity="0.28" />
        </>
      )}
      <polygon
        points="25,14 75,14 95,38 50,92 5,38"
        fill="none"
        stroke={locked ? "#3a3b5c" : "rgba(255,255,255,0.55)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polyline
        points="5,38 35,38 25,14 M35,38 50,92 65,38 M65,38 75,14 95,38"
        fill="none"
        stroke={locked ? "#2c2d4a" : "rgba(255,255,255,0.35)"}
        strokeWidth="1"
      />
    </svg>
  );
}
