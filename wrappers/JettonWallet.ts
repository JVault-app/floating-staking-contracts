import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
import { Opcodes, Gas } from './constants';
export type JettonWalletConfig = {
    ownerAddress: Address;
    minterAddress: Address;
    walletCode: Cell;
};

export function jettonWalletConfigToCell(config: JettonWalletConfig): Cell {
    return beginCell()
        .storeCoins(0)
        .storeAddress(config.ownerAddress)
        .storeAddress(config.minterAddress)
        .storeRef(config.walletCode)
        .endCell();
}

export class JettonWallet implements Contract {
    // COMMON
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new JettonWallet(address);
    }

    static createFromConfig(config: JettonWalletConfig, code: Cell, workchain = 0) {
        const data = jettonWalletConfigToCell(config);
        const init = { code, data };
        return new JettonWallet(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        toAddress: Address,
        fwdAmount: bigint,
        jettonAmount: bigint,
        fwdPayload: Cell,
        queryId?: number,
    ) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0xf8a7ea5, 32)
                .storeUint(queryId ?? 0, 64)
                .storeCoins(jettonAmount)
                .storeAddress(toAddress)
                .storeAddress(via.address)
                .storeUint(0, 1)
                .storeCoins(fwdAmount)
                .storeUint(1, 1)
                .storeRef(fwdPayload)
                .endCell(),
        });
    }

    async sendBurn(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        jettonAmount: bigint,
        queryId?: number,
    ) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(0x595f07bc, 32)
                .storeUint(queryId ?? 0, 64)
                .storeCoins(jettonAmount)
                .storeAddress(via.address)
                .storeUint(0, 1)
                .endCell(),
        });
    }

    // CUSTOM
    async sendAddRewards(
        provider: ContractProvider,
        via: Sender,
        stakingAddress: Address,
        rewardsAmount: bigint,
        newEndTime?: number,
        queryId?: number,
    ) {
        let forwardPayload = beginCell().storeUint(0xffffffff, 32);
        if (newEndTime) {
            forwardPayload = forwardPayload.storeUint(newEndTime, 32);
        }

        return await this.sendTransfer(
            provider, 
            via, 
            Gas.send_commissions + Gas.jetton_transfer,
            stakingAddress,
            Gas.send_commissions,
            rewardsAmount,
            forwardPayload.endCell(),
            (queryId ?? 0)
        )
    }

    async sendStake(
        provider: ContractProvider,
        via: Sender,
        stakingAddress: Address,
        stakeAmount: bigint,
        stakePeriod: number,
        transferAllowed: boolean,
        queryId?: number,
    ) {
        let forwardPayload = beginCell()
                                .storeUint(stakePeriod, 32)
                                .storeBit(transferAllowed);

        return await this.sendTransfer(
            provider, 
            via, 
            Gas.send_commissions + Gas.jetton_transfer,
            stakingAddress,
            Gas.send_commissions,
            stakeAmount,
            forwardPayload.endCell(),
            (queryId ?? 0)
        )
    }

    async getBalance(provider: ContractProvider) {
        const result = await provider.get('get_wallet_data', []);
        return result.stack.readBigNumber();
    }
}