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

    const isReady = () => (
        (typeof web3 !== undefined) &&
        (typeof contracts !== undefined) &&
        (typeof accounts !== undefined)
    );

    if(!isReady()){
        console.log("in Loading section");
        return (<div><h3>Loadding.......</h3></div>);
    }
    
    console.log("in App section");
    return  (<App />);
}

export default LoadingComponent;