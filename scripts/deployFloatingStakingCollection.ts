import { Address, Slice, toNano, Cell, beginCell } from '@ton/core';
import { FloatingStaking } from '../wrappers/FloatingStakingCollection';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const floatingStaking = provider.open(
        FloatingStaking.createFromConfig(
            {
                init: 1n, 
                next_item_index: 321n,
                last_update_time: 1711634270n,
                admin_address: Address.parse("0QCWVqwkomdw-o4wsVqdBO_HHkv584nZw0ziJUVgeUWG6MkO") as Address,

                nft_item_code: await compile('NftItem'),
                collection_content: Cell.fromBase64("te6ccgEBAwEAagACAAECAFxodHRwczovL2p2YXVsdC5hcHAvY29sbGVjdGlvbl9jb250ZW50P25hbWU9SlZUAGhodHRwczovL2p2YXVsdC5hcHAvbmZ0X2NvbnRlbnQ/Y29sbGVjdGlvbj1KVlQmaW5kZXg9"),

                last_tvl: 909197129509998n,
                distributed_rewards: 20185462348121548244921499133n, 

                min_lock_period: 0n,
                farming_speed: 0n, 

                rewards_balance: 250000000999938n, 
                commission_factor: 0n, 

                lock_wallet_set        : 0n,
                rewards_wallet_set     : 0n,
                premint_open           : 1n,

                start_time             : 1707251534n,
                end_time               : 1770336000n,
                minimum_deposit        : 20000000000n,

                lock_wallet_address    : Address.parse("EQC8FoZMlBcZhZ6Pr9sHGyHzkFv9y2B5X9tN61RvucLRzFZz") as Address,
                rewards_wallet_address : Address.parse("EQC8FoZMlBcZhZ6Pr9sHGyHzkFv9y2B5X9tN61RvucLRzFZz") as Address,
                creator_address        : Address.parse("0QCWVqwkomdw-o4wsVqdBO_HHkv584nZw0ziJUVgeUWG6MkO") as Address

            },
            await compile('FloatingStakingCollection')
        )
    );

    await floatingStaking.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(floatingStaking.address);

    console.log('ID', await floatingStaking.getID());
}
