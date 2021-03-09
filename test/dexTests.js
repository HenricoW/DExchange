const Dai = artifacts.require('../contracts/Dai.sol');
const Bat = artifacts.require('../contracts/Bat.sol');
const Zrx = artifacts.require('../contracts/Zrx.sol');
const Rep = artifacts.require('../contracts/Rep.sol');
const Dex = artifacts.require('../contracts/dExch.sol');

contract("Dex", (accounts) => {
    let dai, bat, zrx, rep, dex;
    
    beforeEach(async () => {

        [dai, bat, rep, zrx, dex] = await Promise.all([
            Dai.new(),
            Bat.new(),
            Rep.new(),
            Zrx.new(),
            Dex.new(),
        ]);

        const [b32DAI, b32BAT, b32REP, b32ZRX] = web3.utils.fromAscii(['DAI', 'BAT', 'REP', 'ZRX']);
        const tickers = [b32DAI, b32BAT, b32REP, b32ZRX];
        const tokenPtrs = [dai, bat, rep, zrx];

        await Promise.all(() => {
            dex.addToken(b32DAI, dai.address);
            dex.addToken(b32BAT, bat.address);
            dex.addToken(b32REP, rep.address);
            dex.addToken(b32ZRX, zrx.address);
        });

        dexClients = [accounts[1], accounts[2]]
        amounts = web3.utils.toWei('1000');

        dexClients.map(async acc => {
            await Promise.all(() => {
                dai.faucet(acc, amounts);
                bat.faucet(acc, amounts);
                rep.faucet(acc, amounts);
                zrx.faucet(acc, amounts);
            });
        });

        dexClients.map(async (acc) => {
            await Promise.all(() => {
                dai.approve(dex.address, amounts, {from: acc});
                bat.approve(dex.address, amounts, {from: acc});
                rep.approve(dex.address, amounts, {from: acc});
                zrx.approve(dex.address, amounts, {from: acc});
            });
        });
        
        
    });

});


