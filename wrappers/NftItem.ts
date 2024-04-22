import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';
import { Gas, Opcodes } from './constants';
export type NftItemConfig = {
    collection_index: number;
    collection_address: Address; 
};

export function nftItemConfigToCell(config: NftItemConfig): Cell {
    return beginCell()
                .storeUint(config.collection_index, 32)
                .storeAddress(config.collection_address)
            .endCell();
}

export class NftItem implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftItem(address);
    }

    static createFromConfig(config: NftItemConfig, code: Cell, workchain = 0) {
        const data = nftItemConfigToCell(config);
        const init = { code, data };
        return new NftItem(contractAddress(workchain, init), init);
    }

    async sendTransferNft(provider: ContractProvider, 
                          via: Sender,
                          toAddress: Address,
                          forwardAmount: bigint,
                          forwardPayload?: Cell,
                          queryId?: number) {
        await provider.internal(
            via, 
            {
                value: Gas.jetton_transfer,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                        .storeUint(Opcodes.transfer_nft, 32)
                        .storeUint(queryId ?? 0, 64)
                        .storeAddress(toAddress)
                        .storeAddress(via.address)
                        .storeBit(0)
                        .storeCoins(forwardAmount)
                        .storeMaybeRef(forwardPayload)

                    .endCell()
            }
        );
    }
    
    async sendClaimNft(provider: ContractProvider, 
                       via: Sender,
                       queryId?: number) {
        await provider.internal(
            via, 
            {
                value: Gas.claim_nft,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                        .storeUint(Opcodes.claim_nft, 32)
                        .storeUint(queryId ?? 0, 64)
                    .endCell()
            }
        );
    }

    async sendWithdrawNft(provider: ContractProvider, 
                          via: Sender,
                          queryId?: number) {
        await provider.internal(
            via, 
            {
                value: Gas.withdraw_nft,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                        .storeUint(Opcodes.withdraw_nft, 32)
                        .storeUint(queryId ?? 0, 64)
                    .endCell()
            }
        );
    }

    async sendWithdrawJetton(provider: ContractProvider, 
                             via: Sender,
                             jettonWallet: Address,
                             jettonAmount: number,
                             queryId?: number) {
        await provider.internal(
            via, 
            {
                value: Gas.jetton_transfer,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                        .storeUint(3, 32)
                        .storeUint(queryId ?? 0, 64)
                        .storeAddress(jettonWallet)
                        .storeCoins(jettonAmount)
                    .endCell()
            }
        );
    }

    async sendWithdrawTon(provider: ContractProvider, 
                          via: Sender,
                          queryId?: number) {
        await provider.internal(
            via, 
            {
                value: toNano("0.01"),
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                        .storeUint(4, 32)
                        .storeUint(queryId ?? 0, 64)
                    .endCell()
            }
        );
    }
}
