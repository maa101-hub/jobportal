import "./LiquidLoader.css";

const LiquidLoader = ({ label = "Loading" }) => (
  <span className="liquid-loader" role="status" aria-label={label}>
    <span className="liquid-loader-tank" aria-hidden="true">
      <span className="liquid-loader-fill" />
      <span className="liquid-loader-shimmer" />
    </span>
    <span className="liquid-loader-label">{label}</span>
  </span>
);

export default LiquidLoader;
