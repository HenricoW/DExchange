import React, { useState, useEffect, useRef } from "react";
import Footer from './Footer.js';
import Header from "./Header";
import Wallet from "./Wallet.js";
import NewOrder from "./NewOrder";
import AllOrders from "./AllOrders";
import AllTrades from "./AllTrades";

const SIDE = {
  BUY: 0,
  SELL: 1
}

function App({ web3, contracts, accounts }) {
  const [tokens, setTokens] = useState(undefined);
  const [user, setUser] = useState({
    accounts: [],
    selectedToken: undefined
  });
  const [balances, setBalances] = useState({
    tokenDex: 0,
    tokenWallet: 0
  });
  const [orders, setOrders] = useState({
    buy: [],
    sell: []
  });
  const [trades, _setTrades] = useState([]);
  const [listener, setListener] = useState(undefined);

  const tradesRef = useRef(trades);
  
  useEffect(() => {
    const init = async () => {
      const rawTokens = await contracts.dex.methods.getTokens().call();
      const dexBal = await contracts.dex.methods.userBalances(accounts[0], rawTokens[0].ticker).call();
      const tickerText = web3.utils.hexToUtf8(rawTokens[0].ticker);
      const wallBal = await contracts[tickerText].methods.balanceOf(accounts[0]).call();
      await getOrders(rawTokens[0]);
      await fetchTrades(rawTokens[0]);
  
      setTokens(rawTokens);
      setUser({
        accounts,
        selectedToken: rawTokens[0]
      });
      setBalances({
        tokenDex: dexBal,
        tokenWallet: wallBal
      });
    }

    init();

  }, []);

  useEffect(() => {
    const init = async () => {
      setTrades([]);
      if(user.selectedToken === undefined) return
      fetchTrades(user.selectedToken);
    }

    init();
  }, [user.selectedToken],
   () => listener.unsubscribe()                                         // when exactly will this be fired? Why not before new fetchTrades() call?
  );

  const setTrades = trade => {
    let nuTrades = tradesRef.current;

    trade.length === 0 ? nuTrades = [] : nuTrades.push(trade)
    tradesRef.current = nuTrades;
    _setTrades(nuTrades);
  }

  const fetchTrades = async theToken => {
    let tradeIds = new Set();
    console.log("fetchTrades fired");
    const _listener = contracts.dex.events.tradeExecuted({
      filter: { ticker: theToken.ticker },                        // filter only works on indexed fields in the event !!
      fromBlock: 0                                                // INEFFICIENT for production OR testnet !!!!
    })
    .on('data', data => {
      if(tradeIds.has(data.returnValues.tradeId)) { 
        return
      } else {
        tradeIds.add(data.returnValues.tradeId);
        setTrades(data.returnValues);
      }
    });

    setListener(_listener);
  }

  const getOrders = async (token) => {
    const orderLists = await Promise.all([
      contracts.dex.methods.viewOrderBook(token.ticker, SIDE.BUY).call(),
      contracts.dex.methods.viewOrderBook(token.ticker, SIDE.SELL).call()
    ]);
    setOrders({buy: orderLists[0], sell: orderLists[1]});
  }

  const onSelect = async item => {
    setUser({
      ...user,
      selectedToken: item.value
    });
    await updateBalances(user.accounts[0], item.value);
    await getOrders(item.value);
  }

  const updateBalances = async (account, token) => {
    let dexBal = await contracts.dex.methods.userBalances(account, token.ticker).call();
    const tickerText = web3.utils.hexToUtf8(token.ticker);
    let wallBal = await contracts[tickerText].methods.balanceOf(account).call();
    setBalances({ tokenDex: dexBal, tokenWallet: wallBal });
  }

  const deposit = async amount => {
    const tickerText = web3.utils.hexToUtf8(user.selectedToken.ticker);
    await contracts[tickerText].methods.approve(contracts.dex.options.address, amount).send({from: user.accounts[0]});
    await contracts.dex.methods.deposit(user.selectedToken.ticker, amount).send({from: user.accounts[0]});
    await updateBalances(user.accounts[0], user.selectedToken);
  }
  
  const withdraw = async amount => {
    await contracts.dex.methods.withdraw(user.selectedToken.ticker, amount).send({from: user.accounts[0]});
    await updateBalances(user.accounts[0], user.selectedToken);
  }

  const createMarketOrder = async (side, amount) => {
    await contracts.dex.methods.createMarketOrder(user.selectedToken.ticker, side, amount).send({from: accounts[0]});
    await getOrders(user.selectedToken);
    await fetchTrades(user.selectedToken);
  }

  const createLimitOrder = async (side, amount, price) => {
    await contracts.dex.methods.createLimitOrder(side, user.selectedToken.ticker, amount, price).send({from: accounts[0]});
    await getOrders(user.selectedToken);
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
            {(web3.utils.hexToUtf8(user.selectedToken.ticker) === 'DAI') ? null : 
              <NewOrder 
                createLimitOrder={createLimitOrder}
                createMarketOrder={createMarketOrder}
              />
            }
          </div>
          <div className="col-sm-8">
            <AllOrders orders={orders}/>
            <AllTrades trades={tradesRef.current} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
