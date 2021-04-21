import React, { useState, useEffect } from "react";
import Footer from './Footer.js';
import Header from "./Header";


function App({ web3, contracts, accounts }) {
  useEffect(() => {
    const init = async () => {
      const rawTokens = await contracts.dex.methods.getTokens().call();
  
      setTokens(rawTokens);
      setUser({
        accounts,
        selectedToken: rawTokens[0]
      });
    }

    init();

  }, []);

  const [tokens, setTokens] = useState(undefined);
  const [user, setUser] = useState({
    accounts: [],
    selectedToken: undefined
  });
  
  const onSelect = item => {
    setUser({
      ...user,
      selectedToken: item.value
    });
  }

  if(tokens === undefined || user.selectedToken === undefined || contracts === undefined) return <div>Loading...</div>

  return (
    <div id="app">
      <Header dex={contracts.dex} user={user} tokens={tokens} onSelect={onSelect} web3={web3} />
      <div>
        Main part
      </div>
      <Footer />
    </div>
  );
}

export default App;
