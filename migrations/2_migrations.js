const Dai = artifacts.require("../client/fend/src/contracts/Dai");
const Bat = artifacts.require("../client/fend/src/contracts/Bat");
const Zrx = artifacts.require("../client/fend/src/contracts/Zrx");
const Rep = artifacts.require("../client/fend/src/contracts/Rep");
const Dex = artifacts.require("../client/fend/src/contracts/dExch");
const ERC20 = artifacts.require("../client/fend/src/contracts/ERC20");

// RINKEBY
const DAI_ADDR = "0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea";
const BAT_ADDR = "0xbf7a7169562078c96f0ec1a8afd6ae50f12e5a99"; // CAUSES FAILURES ON TRANSFER_FROM (RINKEBY)
const ZRX_ADDR = "0xddea378a6ddc8afec82c36e9b0078826bf9e68b6";
const USDC_ADDR = "0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b";

const wait = (secs) => {
    return new Promise((res, rej) => {
        setTimeout(() => res(), secs * 1000);
    });
};

const SIDE = {
    BUY: 0,
    SELL: 1,
};

module.exports = async (deployer, network, accounts) => {
    if (network !== "development") {
        await deployer.deploy(Dex);
        const dex = await Dex.deployed();
        // const dai = await ERC20.at(DAI_ADDR);
        // const bat = await ERC20.at(BAT_ADDR);
        // const zrx = await ERC20.at(ZRX_ADDR);
        const [b32DAI, b32ZRX, b32USDC] = ["DAI", "ZRX", "USDC"].map((item) => web3.utils.fromAscii(item));
        await Promise.all([
            dex.addToken(b32DAI, DAI_ADDR),
            dex.addToken(b32ZRX, ZRX_ADDR),
            dex.addToken(b32USDC, USDC_ADDR),
        ]);
        await wait(3);
        const rawTokens = await dex.viewTokenList();
        const tokens = rawTokens.map((tkn) => tkn.split(0, 3));
        console.log(tokens);
    }

    if (network === "development") {
        // await Promise.all([Dai, Bat, Zrx, Rep, Dex].map((contr) => deployer.deploy(contr)));
        await Promise.all([Dai, Bat, Dex].map((contr) => deployer.deploy(contr)));
        // [dai, bat, zrx, rep, dex] = await Promise.all([Dai, Bat, Zrx, Rep, Dex].map((contr) => contr.deployed()));
        [dai, bat, dex] = await Promise.all([Dai, Bat, Dex].map((contr) => contr.deployed()));
        // const [b32DAI, b32BAT, b32REP, b32ZRX] = ["DAI", "BAT", "REP", "ZRX"].map((item) => web3.utils.fromAscii(item));
        const [b32DAI, b32BAT] = ["DAI", "BAT"].map((item) => web3.utils.fromAscii(item));
        console.log("Adding tokens to dEX");
        await Promise.all([
            dex.addToken(b32DAI, dai.address),
            dex.addToken(b32BAT, bat.address),
            // dex.addToken(b32REP, rep.address),
            // dex.addToken(b32ZRX, zrx.address),
        ]);
        const amount = web3.utils.toWei("300");
        const amountD = web3.utils.toWei("200");
        // const [trader1, trader2, trader3, trader4, _] = accounts;
        const [trader1, trader2, _] = accounts;
        // seedTokens fn
        const seedToken = async (tkn, trader) => {
            console.log("faucet fired for: ", trader);
            console.log("faucet amount: ", web3.utils.fromWei(amount));
            await wait(2);
            await tkn.faucet(trader, amount);
            await tkn.approve(dex.address, amountD, { from: trader });
            const tckr = web3.utils.fromAscii(await tkn.symbol());
            await dex.deposit(tckr, amountD, { from: trader });
            await wait(3);
        };
        console.log("Running Seed token mapping");
        [trader1, trader2].map(async (trdr) => {
            // await Promise.all([dai, bat, zrx, rep].map((tkn) => seedToken(tkn, trdr)));
            await Promise.all([dai, bat].map((tkn) => seedToken(tkn, trdr)));
        });
        await wait(10);
        console.log();
        let ExbalDai = await dex.userBalances(trader1, b32DAI);
        let ExbalBat = await dex.userBalances(trader1, b32BAT);
        let balDai = await dai.balanceOf(trader1);
        let balBat = await bat.balanceOf(trader1);
        console.log("Exch Dai balance: ", web3.utils.fromWei(ExbalDai));
        console.log("Exch Bat balance: ", web3.utils.fromWei(ExbalBat));
        console.log("Dai balance: ", web3.utils.fromWei(balDai));
        console.log("Bat balance: ", web3.utils.fromWei(balBat));
        // =========================================================================== //
        // const increaseTime = async seconds => {
        //     await web3.currentProvider.send({
        //         jsonrpc: "2.0",
        //         method: "evm_increaseTime",
        //         params: [seconds],
        //         id: 0
        //     }, () => {});
        //     await web3.currentProvider.send({
        //         jsonrpc: "2.0",
        //         method: "evm_mine",
        //         params: [],
        //         id: 0
        //     }, () => {});
        // }
        // //create trades
        // await dex.createLimitOrder(SIDE.BUY, b32BAT, 1000, 10, {from: trader1});
        // await dex.createMarketOrder(b32BAT, SIDE.SELL, 1000, {from: trader2});
        // await increaseTime(1);
        // await dex.createLimitOrder(SIDE.BUY, b32BAT, 1200, 11, {from: trader1});
        // await dex.createMarketOrder(b32BAT, SIDE.SELL, 1200, {from: trader2});
        // await increaseTime(1);
        // console.log("Done with matching orders");
        // //create orders
        // await Promise.all([
        //     dex.createLimitOrder(SIDE.BUY, b32BAT, 1400, 10, {from: trader1}),
        //     dex.createLimitOrder(SIDE.SELL, b32BAT, 500, 14, {from: trader4}),
        // ]);
        // console.log("Done with limit orders");
    }
};
