import React, { useState, useEffect } from 'react';
import { getWeb3, getContracts } from './utils';
import App from './App';

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
        }

        init();
    }, []);

    if( (web3 === undefined) || (contracts === undefined) || (accounts === undefined) ){
        return (<div><h3>Loading.......</h3></div>);
    } else {
        return  (<App web3={web3} contracts={contracts} accounts={accounts} />);
    }
}

export default LoadingComponent;