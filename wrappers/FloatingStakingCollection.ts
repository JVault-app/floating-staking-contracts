import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type FloatingStakingConfig = {
    init: bigint, 
    next_item_index: bigint,
    last_update_time: bigint,
    admin_address: Address,

    nft_item_code: Cell,
    collection_content: Cell,

    last_tvl: bigint,
    distributed_rewards: bigint, 

    min_lock_period: bigint,
    farming_speed: bigint, 

    rewards_balance: bigint, 
    commission_factor: bigint, 

    lock_wallet_set        : bigint,
    rewards_wallet_set     : bigint,
    premint_open           : bigint,

    start_time             : bigint,
    end_time               : bigint,
    minimum_deposit        : bigint,

    lock_wallet_address    : Address,
    rewards_wallet_address : Address,
    creator_address        : Address


};

export function floatingStakingConfigToCell(config: FloatingStakingConfig): Cell {
    return beginCell()
            .storeUint(config.init, 1)
            .storeUint(config.next_item_index, 32)
            .storeUint(config.last_update_time, 32)
            .storeAddress(config.admin_address)
            .storeRef(config.nft_item_code)
            .storeRef(config.collection_content)
            .storeCoins(config.last_tvl)
            .storeUint(config.distributed_rewards, 256)
            .storeUint(config.min_lock_period, 32)
            .storeCoins(config.farming_speed)
            .storeCoins(config.rewards_balance)
            .storeUint(config.commission_factor, 16)
            .storeUint(config.lock_wallet_set, 1)
            .storeUint(config.rewards_wallet_set, 1)
            .storeUint(config.premint_open, 1)
            .storeRef(
                beginCell()
                    .storeUint(config.start_time, 32)
                    .storeUint(config.end_time, 32)
                    .storeCoins(config.minimum_deposit)
                    .storeAddress(config.lock_wallet_address)
                    .storeAddress(config.rewards_wallet_address)
                    .storeAddress(config.creator_address)
                .endCell()
            )
    .endCell();
}

export const Opcodes = {
    increase: 0x7e8764ef,
};

export class FloatingStaking implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new FloatingStaking(address);
    }

    static createFromConfig(config: FloatingStakingConfig, code: Cell, workchain = 0) {
        const data = floatingStakingConfigToCell(config);
        const init = { code, data };
        return new FloatingStaking(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendIncrease(
        provider: ContractProvider,
        via: Sender,
        opts: {
            increaseBy: bigint;
            value: bigint;
            queryID?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.increase, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(opts.increaseBy, 32)
                .endCell(),
        });
    }

    async getCounter(provider: ContractProvider) {
        const result = await provider.get('get_counter', []);
        return result.stack.readNumber();
    }

    async getID(provider: ContractProvider) {
        const result = await provider.get('get_id', []);
        return result.stack.readNumber();
    }
}
