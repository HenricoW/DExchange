import React, { useState } from "react";
import Footer from './Footer.js';
import Dropdown from "./Dropdown";

const itemsInit = [
  {
    label: "hello",
  },
  {
    label: "there",
  },
  {
    label: "smokeshow",
  }
];


function App() {
  const [items, setItems] = useState(itemsInit);
  const [selectedItem, setSelectedItem] = useState(items[0]);
  
  const onSelect = item => setSelectedItem(item);

  return (
    <div id="app">
     <div>
       Header
      </div>
      <Dropdown onSelect={onSelect} activeItem={selectedItem} items={items} />
      <div>
        Main part
      </div>
      <Footer />
    </div>
  );
}

export default App;
