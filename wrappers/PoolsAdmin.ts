import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type PoolsAdminConfig = {
    stakingPoolCode: Cell;
    nftItemCode: Cell;
    creationFee: bigint;
    ownerAddress1: Address;
    ownerAddress2: Address;
};

export function poolsAdminConfigToCell(config: PoolsAdminConfig): Cell {
    return beginCell()
                .storeRef(beginCell().endCell())
                .storeRef(config.stakingPoolCode)
                .storeRef(config.nftItemCode)
                .storeCoins(config.creationFee)
                .storeAddress(config.ownerAddress1)  // main owner
                .storeAddress(config.ownerAddress2)  // address for distribution part of income to JVT holders
            .endCell();
}

export class PoolsAdmin implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new PoolsAdmin(address);
    }

    static createFromConfig(config: PoolsAdminConfig, code: Cell, workchain = 0) {
        const data = poolsAdminConfigToCell(config);
        const init = { code, data };
        return new PoolsAdmin(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
