const Dai = artifacts.require('../contracts/Dai.sol');
const Bat = artifacts.require('../contracts/Bat.sol');
const Dex = artifacts.require('../contracts/dExch.sol');

module.exports = async (deployer, _network, accounts) => {
    await Promise.all([
        deployer.deploy(Dex),
        deployer.deploy(Bat),
        deployer.deploy(Dai)
    ]);

    const [dai, bat, dex] = await Promise.all([
        Dai.new(),
        Bat.new(),
        Dex.new()
    ]);

    const [b32DAI, b32BAT, b32REP, b32ZRX] = ['DAI', 'BAT', 'REP', 'ZRX'].map(item => web3.utils.fromAscii(item) );

    // await dex.addToken(b32DAI, dai.address);
    // await dex.addToken(b32BAT, bat.address);
};
