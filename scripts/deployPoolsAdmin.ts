import { Address, toNano } from '@ton/core';
import { PoolsAdmin } from '../wrappers/PoolsAdmin';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const poolsAdmin = provider.open(PoolsAdmin.createFromConfig({
        stakingPoolCode: await compile("FloatingStakingCollection"),
        nftItemCode: await compile('NftItem'),
        sharecomsCode: await compile('Sharecoms'),
        creationFee: 100000000n,  // 0.1 TON
        ownerAddress1: Address.parse("UQCovSj8c8Ik1I-RZt7dbIOEulYe-MfJ2SN5eMhxwfACvp7x") as Address,
        ownerAddress2: Address.parse("UQAWY4TBRhQgZF9AQLvyOQ8lKDYoWJYyIicOEBx7eNgS4lMc") as Address
    }, await compile('PoolsAdmin')));

    await poolsAdmin.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(poolsAdmin.address);

    // run methods on `poolsAdmin`
}
