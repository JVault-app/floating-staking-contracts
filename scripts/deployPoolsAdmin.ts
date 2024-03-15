import { Address, Slice, toNano, Cell, beginCell } from '@ton/core';
import { PoolsAdmin } from '../wrappers/PoolsAdmin';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const poolsAdmin = provider.open(PoolsAdmin.createFromConfig({
        creationFee: 100000000n,  // 0.1 TON
        changeFee: 100000000n,    // 0.1 JVT
        jvtStakingAddress: Address.parse("kQBMkMK08LGfS6vApVxiMGnjB27O7VhdWqralEdaB87L4pYt"),
        jvtWalletAddress: Address.parse("kQBMkMK08LGfS6vApVxiMGnjB27O7VhdWqralEdaB87L4pYt"),

        sharecomsCode: await compile('Sharecoms'),
        stakingPoolCode: await compile("FloatingStakingCollection"),
        nftItemCode: await compile('NftItem'),

        teamAddress: Address.parse("0QAWES8quo0uywd5s5-542nlg0tvuVzG17tHHjg3tDjWYdpU") as Address,
        conversionAddress: Address.parse("0QAWES8quo0uywd5s5-542nlg0tvuVzG17tHHjg3tDjWYdpU") as Address,
        host: "https://jvault.ru"
    }, await compile('PoolsAdmin')));

    await poolsAdmin.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(poolsAdmin.address);

    // run methods on `poolsAdmin`
}
