const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const Dai = artifacts.require('../contracts/Dai.sol');
const Bat = artifacts.require('../contracts/Bat.sol');
const Zrx = artifacts.require('../contracts/Zrx.sol');
const Rep = artifacts.require('../contracts/Rep.sol');
const Dex = artifacts.require('../contracts/dExch.sol');


const wait = (secs) => {
    return new Promise((res, rej) => {
        setTimeout(() => res(), secs*1000);
    });
}

const SIDE = {
    BUY: 0,
    SELL: 1
};

module.exports = async (deployer, _network, accounts) => {
    await Promise.all(
        [Dai, Bat, Zrx, Rep, Dex].map(contr => deployer.deploy(contr))
    );

    [dai, bat, zrx, rep, dex] = await Promise.all(
        [Dai, Bat, Zrx, Rep, Dex].map(contr => contr.deployed())
    );

    const [b32DAI, b32BAT, b32REP, b32ZRX] = ['DAI', 'BAT', 'REP', 'ZRX'].map( item => web3.utils.fromAscii(item) );

    await Promise.all([
        dex.addToken(b32DAI, dai.address),
        dex.addToken(b32BAT, bat.address),
        dex.addToken(b32REP, rep.address),
        dex.addToken(b32ZRX, zrx.address)
    ]);

    const amount = web3.utils.toWei('100000');
    const [trader1, trader2, trader3, trader4, _] = accounts;

    // seedTokens fn
    const seedToken = async (tkn, trader) => {
        await wait(1);
        await tkn.faucet(trader, amount);
        await tkn.approve(dex.address, amount, {from: trader});
        const tckr = web3.utils.fromAscii(await tkn.symbol());
        await dex.deposit(tckr, amount, {from: trader});
    }

    [trader1, trader2, trader3, trader4].map(async trdr => {
        await Promise.all(
            [dai, bat, zrx, rep].map(tkn => seedToken(tkn, trdr))
        );
    });

    await wait(15);
    console.log(await dex.userBalances(trader1, b32DAI));

    const increaseTime = async seconds => {
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [seconds],
            id: 0
        }, () => {});

        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            params: [],
            id: 0
        }, () => {});
    }

    //create trades
    await dex.createLimitOrder(SIDE.BUY, b32BAT, 1000, 10, {from: trader1});
    await dex.createMarketOrder(b32BAT, SIDE.SELL, 1000, {from: trader2});
    await increaseTime(1);
    await dex.createLimitOrder(SIDE.BUY, b32BAT, 1200, 11, {from: trader1});
    await dex.createMarketOrder(b32BAT, SIDE.SELL, 1200, {from: trader2});
    await increaseTime(1);
    await dex.createLimitOrder(SIDE.BUY, b32BAT, 1200, 15, {from: trader1});
    await dex.createMarketOrder(b32BAT, SIDE.SELL, 1200, {from: trader2});
    await increaseTime(1);
    await dex.createLimitOrder(SIDE.BUY, b32BAT, 1500, 14, {from: trader1});
    await dex.createMarketOrder(b32BAT, SIDE.SELL, 1500, {from: trader2});
    await increaseTime(1);
    await dex.createLimitOrder(SIDE.BUY, b32BAT, 2000, 12, {from: trader1});
    await dex.createMarketOrder(b32BAT, SIDE.SELL, 2000, {from: trader2});

    await dex.createLimitOrder(SIDE.BUY, b32REP, 1000, 2, {from: trader1});
    await dex.createMarketOrder(b32REP, SIDE.SELL, 1000, {from: trader2});
    await increaseTime(1);
    await dex.createLimitOrder(SIDE.BUY, b32REP, 500, 4, {from: trader1});
    await dex.createMarketOrder(b32REP, SIDE.SELL, 500, {from: trader2});
    await increaseTime(1);
    await dex.createLimitOrder(SIDE.BUY, b32REP, 800, 2, {from: trader1});
    await dex.createMarketOrder(b32REP, SIDE.SELL, 800, {from: trader2});
    await increaseTime(1);
    await dex.createLimitOrder(SIDE.BUY, b32REP, 1200, 6, {from: trader1});
    await dex.createMarketOrder(b32REP, SIDE.SELL, 1200, {from: trader2});

    console.log("Done with matching orders");

    // //create orders
    await Promise.all([
        dex.createLimitOrder(SIDE.BUY, b32BAT, 1400, 10, {from: trader1}),
        dex.createLimitOrder(SIDE.BUY, b32BAT, 1200, 11, {from: trader2}),
        dex.createLimitOrder(SIDE.BUY, b32BAT, 1000, 12, {from: trader2}),

        dex.createLimitOrder(SIDE.BUY, b32REP, 3000, 4, {from: trader1}),
        dex.createLimitOrder(SIDE.BUY, b32REP, 2000, 5, {from: trader1}),
        dex.createLimitOrder(SIDE.BUY, b32REP, 500, 6, {from: trader2}),

        dex.createLimitOrder(SIDE.BUY, b32ZRX, 4000, 12, {from: trader1}),
        dex.createLimitOrder(SIDE.BUY, b32ZRX, 3000, 13, {from: trader1}),
        dex.createLimitOrder(SIDE.BUY, b32ZRX, 500, 14, {from: trader2}),

        dex.createLimitOrder(SIDE.SELL, b32BAT, 2000, 16, {from: trader3}),
        dex.createLimitOrder(SIDE.SELL, b32BAT, 3000, 15, {from: trader4}),
        dex.createLimitOrder(SIDE.SELL, b32BAT, 500, 14, {from: trader4}),

        dex.createLimitOrder(SIDE.SELL, b32REP, 4000, 10, {from: trader3}),
        dex.createLimitOrder(SIDE.SELL, b32REP, 2000, 9, {from: trader3}),
        dex.createLimitOrder(SIDE.SELL, b32REP, 800, 8, {from: trader4}),

        dex.createLimitOrder(SIDE.SELL, b32ZRX, 1500, 23, {from: trader3}),
        dex.createLimitOrder(SIDE.SELL, b32ZRX, 1200, 22, {from: trader3}),
        dex.createLimitOrder(SIDE.SELL, b32ZRX, 900, 21, {from: trader4}),
    ]);

    console.log("Done with limit orders");

};
