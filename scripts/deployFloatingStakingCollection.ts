import { toNano } from '@ton/core';
import { FloatingStaking } from '../wrappers/FloatingStakingCollection';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const floatingStaking = provider.open(
        FloatingStaking.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('FloatingStakingCollection')
        )
    );

    await floatingStaking.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(floatingStaking.address);

    console.log('ID', await floatingStaking.getID());
}
