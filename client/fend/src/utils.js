import Web3 from "web3";
import dExch from "./contracts/dExch.json";
import ERC20Abi from "./ERC20Abi.json";

const getWeb3 = async () => {
  return new Promise(async (resolve, reject) => {
    // MM detection
    if (window.ethereum && window.ethereum.isMetaMask) {
      const web3 = new Web3(window.ethereum);
      try {
        resolve(web3);
      } catch (err) {
        reject(err);
      }
    }
    // Legacy MM detection
    else if (window.web3) {
      const web3 = window.web3;
      console.log("Injected web3 instance detected");
      resolve(web3);
    }
    // fallback provider
    else {
      const provider = new Web3.providers.HttpProvider("http://localhost:9545");
      const web3 = new Web3(provider);
      console.log("No injected web3 provider detected, using local provider");
      resolve(web3);
    }
  });
};

const getContracts = async (web3Inst) => {
  // get relevant network ID from provider
  const networkId = await web3Inst.eth.net.getId();
  // get network config for contract from relevant network ID (contains address)
  const deployedInstance = dExch.networks[networkId];
  // get pointer to relevant deployment of contract
  const dex = new web3Inst.eth.Contract(
    dExch.abi,
    deployedInstance.address // equivalent to: if(deployedInstance) { deployedInstance.address }
  );

  // get access to relevant token contracts
  // get supported tokens: array of Token{ ticker, address }
  const tokens = await dex.methods.getTokens().call();
  // construct output obj
  const contractList = tokens.reduce(
    (acc, tkn) => ({
      ...acc,
      [web3Inst.utils.hexToUtf8(tkn.ticker)]: new web3Inst.eth.Contract(ERC20Abi, tkn.tokenAddr),
    }),
    {}
  );

  return { dex, ...contractList };
};

export { getWeb3, getContracts };
