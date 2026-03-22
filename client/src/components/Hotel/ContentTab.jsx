import { memo } from "react";

function ContentTab({ text }) {
  return (
    <div className="hotel-content-tab">
      <p>{text}</p>
    </div>
  );
}

export default memo(ContentTab);
