const { expectRevert } = require('@openzeppelin/test-helpers');
const Dai = artifacts.require('../contracts/Dai.sol');
const Bat = artifacts.require('../contracts/Bat.sol');
const Zrx = artifacts.require('../contracts/Zrx.sol');
const Rep = artifacts.require('../contracts/Rep.sol');
const Dex = artifacts.require('../contracts/dExch.sol');

contract("dexTest", (accounts) => {
    let dai, bat, zrx, rep, dex;
    const [b32DAI, b32BAT, b32REP, b32ZRX] = ['DAI', 'BAT', 'REP', 'ZRX'].map(item => web3.utils.fromAscii(item) );
    
    const dexClients = [accounts[1], accounts[2]]
    const amounts = web3.utils.toWei('1000');
    
    beforeEach(async () => {
        
        [dai, bat, rep, zrx, dex] = await Promise.all([
            Dai.new(), Bat.new(), Rep.new(), Zrx.new(), Dex.new()
        ]);
        
        const tokenPtrs = [dai, bat, rep, zrx];

        // add tokens for dex to support
        await Promise.all([
            dex.addToken(b32DAI, dai.address),
            dex.addToken(b32BAT, bat.address),
            dex.addToken(b32REP, rep.address),
            dex.addToken(b32ZRX, zrx.address)
        ]);

        // seed accounts with each token supported
        dexClients.map(async acc => {
            await Promise.all( 
                tokenPtrs.map(async ptr => await ptr.faucet(acc, amounts) )
            );
        });

        // approve the dex on the account owners' behalf
        dexClients.map(async acc => {
            await Promise.all( 
                tokenPtrs.map(async ptr => await ptr.approve(dex.address, amounts, {from: acc}) )
            );
        });
        
    });

    // CLIENT DEPOSIT:
    // Happy path - token is supported
    it('Should deposit a supported token', async () => {
        const amount = web3.utils.toWei('100');
        await dex.deposit(b32DAI, amount, {from: accounts[1]});
        
        const userBal = await dex.userBalances(accounts[1], b32DAI);
        assert(userBal.toString() === amount);
    });
    
    // Unhappy path - token is not supported
    it('Should NOT deposit an unsupported token', async () => {
        const amount = web3.utils.toWei('100');
        const TOKEN = web3.utils.fromAscii('TOKEN');
        await expectRevert(
            dex.deposit(TOKEN, amount, {from: accounts[1]}),
            'This token is not supported.'
        );
    });

});