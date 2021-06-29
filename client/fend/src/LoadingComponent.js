import React, { useState, useEffect } from "react";
import { getWeb3, getContracts } from "./utils";
import App from "./App";

const LoadingComponent = () => {
    const [web3, setWeb3] = useState(undefined);
    const [contracts, setContracts] = useState(undefined);
    const [accounts, setAccounts] = useState(undefined);

    useEffect(() => {
        const init = async () => {
            const WEB3 = await getWeb3();
            const CONTR = await getContracts(WEB3);
            const ACCS = await WEB3.eth.getAccounts();
            setWeb3(WEB3);
            setContracts(CONTR);
            setAccounts(ACCS);

            window.ethereum.on("accountsChanged", (accs) => handleAccChg(accs));
        };

        init();
    }, []);

    const handleAccChg = (accs) => (accs.length === 0 ? console.log("Please connect to MetaMask") : setAccounts(accs));

    return web3 === undefined || contracts === undefined || accounts === undefined ? (
        <h3>Loading.......</h3>
    ) : (
        <App web3={web3} contracts={contracts} accounts={accounts} />
    );
};

export default LoadingComponent;
