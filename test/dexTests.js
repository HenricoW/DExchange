const Dai = artifacts.require('../contracts/Dai.sol');
const Bat = artifacts.require('../contracts/Bat.sol');
const Zrx = artifacts.require('../contracts/Zrx.sol');
const Rep = artifacts.require('../contracts/Rep.sol');
const Dex = artifacts.require('../contracts/dExch.sol');

contract("Dex", (accounts) => {
    let dai, bat, zrx, rep, dex;
    
    beforeEach(async () => {

        [dai, bat, rep, zrx, dex] = await Promise.all([
            Dai.new(), Bat.new(), Rep.new(), Zrx.new(), Dex.new(),
        ]);

        const [b32DAI, b32BAT, b32REP, b32ZRX] = web3.utils.fromAscii(['DAI', 'BAT', 'REP', 'ZRX']);
        const tickers = [b32DAI, b32BAT, b32REP, b32ZRX];
        const tokenPtrs = [dai, bat, rep, zrx];
        
        dexClients = [accounts[1], accounts[2]]
        amounts = web3.utils.toWei('1000');

        // add tokens to dex support
        if(tokenPtrs.length !== tickers.length){
            console.error("Token tickers and pointer arrays are not of the same length!");
        } else {
            for(const i = 0; i < tokenPtrs.length; i++){
                await dex.addToken(tickers[i], tokenPtrs[i]);
            }
        }

        // seed accounts with each token supported
        dexClients.map(async acc => {
            await Promise.all(() => {
                tokenPtrs.map((ptr) => {
                    ptr.faucet(acc, amounts);
                });
            });
        });

        // approve the dex on the account owners' behalf
        dexClients.map(async (acc) => {
            await Promise.all(() => {
                tokenPtrs.map(ptr => {
                    ptr.approve(dex.address, amounts, {from: acc});
                });
            });
        });
        
    });

});


