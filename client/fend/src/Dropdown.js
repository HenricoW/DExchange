import React, { useState } from "react";

const Dropdown = ({ items, activeItem, onSelect }) => {
  const [dropdownVisible, setDropDownVisible] = useState(false);

  const selectItem = async (e, item) => {
    e.preventDefault();
    setDropDownVisible(!dropdownVisible);
    await onSelect(item);
  };

  return (
    <div className="dropdown ml-3">
      <button
        className="btn btn-secondary dropdown-toggle"
        type="button"
        onClick={() => setDropDownVisible(!dropdownVisible)}
        style={{ fontSize: "20px" }}
      >
        {activeItem.label}
      </button>
      <div className={`dropdown-menu ${dropdownVisible ? "visible" : ""}`}>
        {items &&
          items.map((item, idx) => (
            <a
              className={`dropdown-item ${item.label === activeItem.label ? "active" : ""}`}
              href="#"
              key={idx}
              onClick={async (e) => await selectItem(e, item)}
            >
              {item.label}
            </a>
          ))}
      </div>
    </div>
  );
};

export default Dropdown;
