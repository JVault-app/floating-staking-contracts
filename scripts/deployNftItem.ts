import { toNano } from '@ton/core';
import { NftItem } from '../wrappers/NftItem';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const nftItem = provider.open(NftItem.createFromConfig({}, await compile('NftItem')));

    await nftItem.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(nftItem.address);

    // run methods on `nftItem`
}
