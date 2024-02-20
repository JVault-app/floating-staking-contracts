import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type SharecomsConfig = {};

export function SharecomsConfigToCell(config: SharecomsConfig): Cell { // need to change 
    return beginCell() .endCell();
}

export class Sharecoms implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Sharecoms(address);
    }

    static createFromConfig(config: SharecomsConfig, code: Cell, workchain = 0) {
        const data = SharecomsConfigToCell(config);
        const init = { code, data };
        return new Sharecoms(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) { 
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
