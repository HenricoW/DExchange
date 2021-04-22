import React, { useState, useEffect } from "react";
import Footer from './Footer.js';
import Header from "./Header";
import Wallet from "./Wallet.js";


function App({ web3, contracts, accounts }) {
  const [tokens, setTokens] = useState(undefined);
  const [user, setUser] = useState({
    accounts: [],
    selectedToken: undefined
  });
  const [balances, setBalances] = useState({
    tokenDex: 0,
    tokenWallet: 0
  })
  
  useEffect(() => {
    const init = async () => {
      const rawTokens = await contracts.dex.methods.getTokens().call();
      const dexBal = await contracts.dex.methods.userBalances(accounts[0], rawTokens[0].ticker).call();
      const tickerText = web3.utils.hexToUtf8(rawTokens[0].ticker);
      const wallBal = await contracts[tickerText].methods.balanceOf(accounts[0]).call()
  
      setTokens(rawTokens);
      setUser({
        accounts,
        selectedToken: rawTokens[0]
      });
      setBalances({
        tokenDex: dexBal,
        tokenWallet: wallBal
      });
      console.log("useEffect: ", user);
    }

    init();

  }, []);

  const onSelect = async item => {
    setUser({
      ...user,
      selectedToken: item.value
    });
    await updateBalances(user.accounts[0], item.value);
  }

  const updateBalances = async (account, token) => {
    let dexBal = await contracts.dex.methods.userBalances(account, token.ticker).call();
    const tickerText = web3.utils.hexToUtf8(token.ticker);
    let wallBal = await contracts[tickerText].methods.balanceOf(account).call();
    console.log(web3.utils.hexToUtf8(user.selectedToken.ticker));
    setBalances({ tokenDex: dexBal, tokenWallet: wallBal });
  }

  // deposit fn
  const deposit = async amount => {
    const tickerText = web3.utils.hexToUtf8(user.selectedToken.ticker);
    await contracts[tickerText].methods.approve(contracts.dex.options.address, amount).send({from: user.accounts[0]});
    await contracts.dex.methods.deposit(user.selectedToken.ticker, amount).send({from: user.accounts[0]});
    await updateBalances(user.accounts[0], user.selectedToken);
  }
  
  // withdraw fn
  const withdraw = async amount => {
    const tickerText = web3.utils.hexToUtf8(user.selectedToken.ticker);
    await contracts.dex.methods.withdraw(user.selectedToken.ticker, amount).send({from: user.accounts[0]});
    await updateBalances(user.accounts[0], user.selectedToken);
  }

  if(tokens === undefined || user.selectedToken === undefined || contracts === undefined) return <div>Loading...</div>

  return (
    <div id="app">
      <Header dex={contracts.dex} user={user} tokens={tokens} onSelect={onSelect} web3={web3} />
      <main className="container-fluid">
        <div className="row">
          <div className="col-sm-4 first-col">
            <Wallet 
              user={user} deposit={deposit} withdraw={withdraw} web3={web3} balances={balances}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
