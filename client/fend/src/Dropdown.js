import React, { useState } from 'react';

const Dropdown = ({onSelect, activeItem, items}) => {

    const [dropdownVisible, setDropDownVisible] = useState(false);

    const selectItem = (e, item) => {
        e.preventDefault();
        setDropDownVisible(!dropdownVisible);
        onSelect(item);
    } 

    return (
        <div className="dropdown ml-3">
            <button className="btn btn-secondary dropdown-toggle" type="button" onClick={() => setDropDownVisible(!dropdownVisible)}>
                {activeItem.label}
            </button>
            <div className={`dropdown-menu ${dropdownVisible ? "visible" : ""}`}>
                {items && items.map((item, idx) => (
                    <a 
                        className={`dropdown-item ${item.label === activeItem.label ? "active" : ""}`} 
                        href="#" 
                        key={idx}
                        onClick={e => selectItem(e, item)}
                        >
                            {item.label}
                    </a>
                ))}
            </div>
        </div>
    )
}

export default Dropdown;
