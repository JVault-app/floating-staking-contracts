import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Slice } from '@ton/core';

export type PoolsAdminConfig = {
    creationFee: bigint;
    changeFee: bigint;
    jvtStakingAddress: Address;
    jvtWalletAddress: Address;

    sharecomsCode: Cell;
    stakingPoolCode: Cell;
    nftItemCode: Cell;
    
    teamAddress: Address;
    conversionAddress: Address;
    
    host: string;
};

export function poolsAdminConfigToCell(config: PoolsAdminConfig): Cell {
    return beginCell()
                .storeCoins(config.creationFee)
                .storeCoins(config.changeFee)

                .storeAddress(config.jvtStakingAddress)
                .storeAddress(config.jvtWalletAddress)

                .storeRef(config.sharecomsCode)
                .storeRef(config.stakingPoolCode)
                .storeRef(config.nftItemCode)
                
                .storeRef(
                    beginCell()
                    .storeAddress(config.teamAddress)  // main owner
                    .storeAddress(config.conversionAddress)  // address for distribution part of income to JVT holders
                    .storeRef(
                        beginCell()
                        .storeStringTail(config.host)
                        .endCell()
                    )
                    .endCell()
                )
            
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
