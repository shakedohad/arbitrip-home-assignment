import { memo } from "react";

function PoliciesTab({ items }) {
  return (
    <section className="hotel-list-tab">
      <ul className="hotel-list-tab__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default memo(PoliciesTab);
