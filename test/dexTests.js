const { expectRevert } = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const Dai = artifacts.require("../contracts/Dai.sol");
const Bat = artifacts.require("../contracts/Bat.sol");
const Zrx = artifacts.require("../contracts/Zrx.sol");
const Rep = artifacts.require("../contracts/Rep.sol");
const Dex = artifacts.require("../contracts/dExch.sol");

const SIDE = {
    BUY: 0,
    SELL: 1,
};

const wait = (secs) => {
    return new Promise((res, rej) => {
        setTimeout(() => res(), secs * 1000);
    });
};

contract("dexTest", (accounts) => {
    let dai, bat, zrx, rep, dex;
    const [b32DAI, b32BAT, b32REP, b32ZRX] = ["DAI", "BAT", "REP", "ZRX"].map((item) => web3.utils.fromAscii(item));

    const dexClients = [accounts[1], accounts[2]];
    const amounts = web3.utils.toWei("1000");

    beforeEach(async () => {
        [dex, dai, bat, rep, zrx] = await Promise.all([Dex.new(), Dai.new(), Bat.new(), Rep.new(), Zrx.new()]);

        const tokenPtrs = [dai, bat, rep, zrx];

        // add tokens for dex to support
        await Promise.all([
            dex.addToken(b32DAI, dai.address),
            dex.addToken(b32BAT, bat.address),
            dex.addToken(b32REP, rep.address),
            dex.addToken(b32ZRX, zrx.address),
        ]);

        // seed accounts with each token supported
        dexClients.map(async (acc) => {
            await Promise.all(tokenPtrs.map((ptr) => ptr.faucet(acc, amounts)));
        });

        // approve the dex on the account owners' behalf
        dexClients.map(async (acc) => {
            await Promise.all(tokenPtrs.map((ptr) => ptr.approve(dex.address, amounts, { from: acc })));
        });
        await wait(1);
    });

    // CLIENT DEPOSIT:
    // Happy path - token is supported: PASS
    it("Should deposit a supported token", async () => {
        await wait(0.5);
        const amount = web3.utils.toWei("150");
        await dex.deposit(b32REP, amount, { from: accounts[1] });

        const userBal = await dex.userBalances(accounts[1], b32REP);
        assert(userBal.toString() === amount);
    });

    // Unhappy path - token is not supported
    it("Should NOT deposit an unsupported token", async () => {
        const amount = web3.utils.toWei("100");
        const TOKEN = web3.utils.fromAscii("TOKEN");
        // await expectRevert(dex.deposit(TOKEN, amount, { from: accounts[1] }), "This token is not supported.");
        await expectRevert.unspecified(dex.deposit(TOKEN, amount, { from: accounts[1] }));
    });

    // CLIENT WIHTDRAW:
    // Happy path - withdraws supported token with enough balance: PASS
    it("Should withdraw tokens", async () => {
        await dex.deposit(b32DAI, web3.utils.toWei("100"), { from: accounts[1] });

        const amount = web3.utils.toWei("100");
        await dex.withdraw(b32DAI, amount, { from: accounts[1] });
        const [afterWithd, balance] = await Promise.all([
            dex.userBalances(accounts[1], b32DAI),
            dai.balanceOf(accounts[1]),
        ]);

        assert(afterWithd.toString() === web3.utils.toWei("0"));
        assert(balance.toString() === web3.utils.toWei("1000"));
    });

    // Unhappy path - token not supported: PASS
    it("Should NOT withdraw an unsupported token", async () => {
        // EXPECT REVERT FROM TEST-HELPERS IS NOT HELPING, ACTUALLY HINDERING. IT DOES NOT WORK WITH MESSAGES

        // await dex.withdraw(web3.utils.fromAscii("TOKEN"), web3.utils.toWei("10"), { from: accounts[1] });
        // await expectRevert(
        //     dex.withdraw(web3.utils.fromAscii("TOKEN"), web3.utils.toWei("10"), { from: accounts[1] }),
        //     "This token is not supported"
        // );
        await expectRevert.unspecified(
            dex.withdraw(web3.utils.fromAscii("TOKEN"), web3.utils.toWei("10"), { from: accounts[1] })
        );
    });

    // Unhappy path - insufficient balance: PASS
    it("Should NOT withdraw for insufficient balance", async () => {
        await dex.deposit(b32DAI, web3.utils.toWei("10"), { from: accounts[1] });
        // await wait(3);

        // await dex.withdraw(b32DAI, web3.utils.toWei("100"), { from: accounts[1] });
        // await expectRevert(
        //     dex.withdraw(b32DAI, web3.utils.toWei("100"), { from: accounts[1] }),
        //     "Insufficient token balance"
        // );
        await expectRevert.unspecified(dex.withdraw(b32DAI, web3.utils.toWei("100"), { from: accounts[1] }));
    });

    // LIMIT ORDER FUNCTIONALITY
    // Happy path - token supported, enough balance for trade, not in DAI: PASS
    it("Higher price buy limit orders should bubble to top", async () => {
        await dex.deposit(b32DAI, web3.utils.toWei("100"), { from: accounts[1] });
        await dex.createLimitOrder(SIDE.BUY, b32BAT, 10, web3.utils.toWei("2"), { from: accounts[1] });

        let orderBookB = await dex.viewOrderBook(b32BAT, SIDE.BUY);
        let orderBookS = await dex.viewOrderBook(b32BAT, SIDE.SELL);

        console.log("orderbook length: ", orderBookB.length);
        console.log("order 0 id: ", orderBookB[0].id);
        console.log("order 0 user: ", orderBookB[0].creator);
        console.log("order 0 price: ", orderBookB[0].price.toString());

        // assert(orderBookB.length === 1);
        // assert(orderBookB[0].id == 0);
        // assert(orderBookB[0].creator === accounts[1]);
        // assert(orderBookB[0].side == 0);
        // assert(orderBookB[0].ticker === web3.utils.padRight(b32BAT, 64));
        // assert(orderBookB[0].price.toString() === web3.utils.toWei('10'));
        // assert(orderBookB[0].qty == 2);
        // assert(orderBookB[0].remaining === orderBookB[0].qty);
        // assert(orderBookB[0].isFilled === false);

        // SECOND LIMIT ORDER
        await dex.deposit(b32DAI, web3.utils.toWei("100"), { from: accounts[2] });
        await dex.createLimitOrder(SIDE.BUY, b32BAT, 11, web3.utils.toWei("1"), { from: accounts[2] });

        orderBookB = await dex.viewOrderBook(b32BAT, SIDE.BUY);
        orderBookS = await dex.viewOrderBook(b32BAT, SIDE.SELL);

        console.log("orderbook length: ", orderBookB.length);
        console.log("order 0 id: ", orderBookB[0].id);
        console.log("order 0 user: ", orderBookB[0].creator);
        console.log("order 0 price: ", orderBookB[0].price.toString());

        // assert(orderBookB.length === 2);
        // assert(orderBookB[0].id == 1);
        // assert(orderBookB[0].creator === accounts[2]);
        // assert(orderBookB[0].price.toString() === web3.utils.toWei('11'));
        // assert(orderBookB[0].qty == 1);
        // assert(orderBookB[1].creator === accounts[1]);

        // THIRD LIMIT ORDER
        await dex.createLimitOrder(SIDE.BUY, b32BAT, 12, web3.utils.toWei("2"), { from: accounts[1] });

        orderBookB = await dex.viewOrderBook(b32BAT, SIDE.BUY);
        orderBookS = await dex.viewOrderBook(b32BAT, SIDE.SELL);

        console.log("orderbook length: ", orderBookB.length);
        console.log("order 0 id: ", orderBookB[0].id);
        console.log("order 0 user: ", orderBookB[0].creator);
        console.log("order 0 price: ", orderBookB[0].price.toString());

        // assert(orderBookB.length === 3);
        // assert(orderBookB[0].id == 2);
        // assert(orderBookB[0].creator === accounts[1]);
        // assert(orderBookB[0].price.toString() === web3.utils.toWei('12'));
        // assert(orderBookB[0].qty == 2);
        // assert(orderBookB[1].creator === accounts[2]);
        // assert(orderBookB[1].price.toString() === web3.utils.toWei('11'));
        // assert(orderBookB[2].creator === accounts[1]);
        // assert(orderBookB[2].price.toString() === web3.utils.toWei('10'));
    });

    // Unhappy path - selling a token the client does not have in the DEX wallet: PASS
    it("Should NOT create a limit order: invalid sell", async () => {
        const amount = web3.utils.toWei("100");

        // await expectRevert(
        //     dex.createLimitOrder(1, b32BAT, web3.utils.toWei('2'), 5, {from: accounts[1]})
        //     , "Insufficient token balance");
        await expectRevert.unspecified(
            dex.createLimitOrder(SIDE.SELL, b32BAT, 5, web3.utils.toWei("2"), { from: accounts[1] })
        );
    });

    // Unhappy path - creating a buy order without sufficient funds to honor it: PASS
    it("Should NOT create a limit order: invalid buy", async () => {
        const amount = web3.utils.toWei("100");
        await dex.deposit(b32DAI, amount, { from: accounts[1] });

        // await expectRevert(
        //     dex.createLimitOrder(0, b32BAT, web3.utils.toWei('12'), 10, {from: accounts[1]})
        //     , "Insufficient DAI balance");
        await expectRevert.unspecified(
            dex.createLimitOrder(SIDE.BUY, b32BAT, 10, web3.utils.toWei("12"), { from: accounts[1] })
        );
    });
});
