import React, { useState, useEffect } from "react";
import { getWeb3, getContracts } from "./utils";
import App from "./App";

const LoadingComponent = () => {
  const [web3, setWeb3] = useState(undefined);
  const [contracts, setContracts] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [chainId, setChainId] = useState(0);

  const connectWeb3 = async () => {
    const WEB3 = await getWeb3();
    setWeb3(WEB3);
    const ACCS = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccounts(ACCS);

    const chainid = await WEB3.eth.getChainId();
    setChainId(chainid);
    if (chainid !== 4) return;

    const CONTR = await getContracts(WEB3);
    setContracts(CONTR);

    window.ethereum.on("accountsChanged", (accs) => handleAccChg(accs));
    window.ethereum.on("chainChanged", (_chainId) => window.location.reload());
  };

  const handleAccChg = (accs) => (accs.length === 0 ? window.location.reload() : setAccounts(accs));

  return web3 === undefined || contracts === undefined || accounts === undefined || chainId !== 4 ? (
    <div className="text-center pt-5 mt-5">
      <h3 className="mt-5">Please switch your MetaMask to the Rinkeby testnet and click CONNECT</h3>
      <h3 className="mt-4">
        PLEASE NOTE: This site is best viewed on a desk/laptop and not suited for smaller screens
      </h3>
      <button type="submit" className="btn btn-primary mt-5" onClick={async () => await connectWeb3()}>
        Connect MetaMask
      </button>
    </div>
  ) : chainId === 4 ? (
    <App web3={web3} contracts={contracts} accounts={accounts} />
  ) : null;
};

export default LoadingComponent;
