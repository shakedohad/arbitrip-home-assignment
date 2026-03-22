import "./Tabs.css";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tabs__button ${active === tab.id ? "tabs__button--active" : ""}`}
            onClick={() => onChange(tab.id)}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
