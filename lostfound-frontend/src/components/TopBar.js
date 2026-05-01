import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function TopBar() {
  const [width,   setWidth]   = useState(0);
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setVisible(true);
    setWidth(20);
    const t1 = setTimeout(() => setWidth(60),  120);
    const t2 = setTimeout(() => setWidth(85),  350);
    const t3 = setTimeout(() => setWidth(100), 600);
    const t4 = setTimeout(() => { setVisible(false); setWidth(0); }, 950);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className="top-bar"
      style={{ width: `${width}%` }}
    />
  );
}

export default TopBar;
