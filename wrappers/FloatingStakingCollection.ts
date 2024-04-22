import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano, TupleBuilder } from '@ton/core';
import { Gas, Opcodes } from './constants';

export type FloatingStakingConfig = {
    init: boolean;                    // Is collection initialized? (uint1)
    next_item_index: number;          // Next item index (uint32)
    lastUpdate_time: number;         // Time of the last update (uint32)
    
    nft_itemCode: Cell;              // NFT code (Cell)
    collectionContent: Cell;         // Collection content (Cell)
    
    last_tvl: bigint;                 // Current TVL (coins)
    distributedRewards: bigint;      // Amount of rewards currently distributed among stakers (per `distributedRewards_devider` jettons)
    
    min_lock_period: number;          // Minimum lock period in seconds (uint32)
    farming_speed: bigint;            // Current farming speed (Coins)
    
    rewards_wallet_address: Address;  // Address of jetton wallet for rewards jettons (MsgAddress)
    rewards_balance: bigint;          // Total rewards (Coins)
    commission_factor: number;        // Commission rate = commission_factor / commission_devider (uint16)
    
    lock_wallet_set: boolean;         // Was lock wallet set? (uint1)
    rewards_wallet_set: boolean;      // Was rewards wallet initialized? (uint1)
    premint_open: boolean;            // Is premint open? always zero for usual pools (uint1)

    start_time: number;               // Timestamp of the start of the staking program (uint32)
    end_time: number;                 // Timestamp of the end of the staking program (uint32)
    minimum_deposit: bigint;          // Minimum deposit (Coins)
    
    lock_wallet_address: Address;     // Address of jetton wallet for locked jettons (MsgAddress)
    admin_address: Address;           // Admin address (MsgAddress)
    creator_address: Address;         // Creator address (MsgAddress)
    
};

export function floatingStakingConfigToCell(config: FloatingStakingConfig): Cell {
    return beginCell()
                .storeBit(config.init)
                .storeUint(config.next_item_index, 32)
                .storeUint(config.lastUpdate_time, 32)
                .storeAddress(config.admin_address)
                .storeRef(config.nft_itemCode)
                .storeRef(config.collectionContent)
                .storeCoins(config.last_tvl)
                .storeUint(config.distributedRewards, 256)
                .storeUint(config.min_lock_period, 32)
                .storeCoins(config.farming_speed)
                .storeCoins(config.rewards_balance)
                .storeUint(config.commission_factor, 16)
                .storeBit(config.lock_wallet_set)
                .storeBit(config.rewards_wallet_set)
                .storeBit(config.premint_open)
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

    async sendSetWalletAddress(provider: ContractProvider, 
                               via: Sender,
                               walletAddress: Address,
                               queryId?: number) {
        await provider.internal(
            via, 
            {
                value: toNano('0.01'),
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                        .storeUint(Opcodes.take_wallet_address, 32)
                        .storeUint(queryId ?? 0, 64)
                        .storeAddress(walletAddress)
                    .endCell()
            }
        )
    }

    async sendGetStorageData(provider: ContractProvider, 
                             via: Sender,
                             value: bigint,
                             toAddress: Address,
                             queryId?: number) {
        await provider.internal(
            via, 
            {
                value: value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                        .storeUint(Opcodes.get_storage_data, 32)
                        .storeUint(queryId ?? 0, 64)
                        .storeAddress(toAddress)
                    .endCell()
            }
        )
    }

    async sendClosePremint(provider: ContractProvider, 
                           via: Sender,
                           queryId?: number) {
        await provider.internal(
            via, 
            {
                value: toNano('0.01'),
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                        .storeUint(Opcodes.close_premint, 32)
                        .storeUint(queryId ?? 0, 64)
                    .endCell()
            }
        );
    }

    async sendChangeStartTime(provider: ContractProvider, 
                              via: Sender,
                              newStartTime: number,
                              queryId?: number) {
        await provider.internal(
            via, 
            {
                value: toNano('0.01'),
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                        .storeUint(Opcodes.change_start_time, 32)
                        .storeUint(queryId ?? 0, 64)
                        .storeUint(newStartTime, 32)
                    .endCell()
            }
        );
    }

    async sendWithdrawRewards(provider: ContractProvider, 
                              via: Sender,
                              jettonAmount: number,
                              queryId?: number) {
        await provider.internal(
            via, 
            {
                value: Gas.jetton_transfer,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                        .storeUint(Opcodes.withdraw_rewards, 32)
                        .storeUint(queryId ?? 0, 64)
                        .storeCoins(jettonAmount)
                    .endCell()
            }
        );
    }

    async sendWithdrawAccidentJettons(provider: ContractProvider, 
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
                        .storeUint(Opcodes.withdraw_accident_jettons, 32)
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

    // Get methods

    async getCollectionData(provider: ContractProvider) {
        let res = await provider.get('get_collection_data', []);

        return {
            nextItemId: res.stack.readNumber(),
            collectionContent: res.stack.readCell().asSlice().skip(8).loadStringTail(),
            ownerAddress: res.stack.readAddress(),
        };
    }

    async getNftAddressByIndex(provider: ContractProvider, index: number): Promise<Address> {
        let tuple = new TupleBuilder();
        tuple.writeNumber(index);
        let res = await provider.get('get_nft_address_by_index', tuple.build());
        return res.stack.readAddress();
    }

    async getNftContent(provider: ContractProvider, index: number) {
        let tuple = new TupleBuilder();
        tuple.writeNumber(index);
        tuple.writeCell(beginCell().storeBit(1).endCell());
        let res = await provider.get('get_nft_content', tuple.build());

        return res.stack.readCell().asSlice().skip(8).loadStringTail();
    }

    async getNftRewards(provider: ContractProvider, nftLockedJettons: bigint, nftDistributedRewards: bigint) {
        let tuple = new TupleBuilder();
        tuple.writeNumber(nftLockedJettons);
        tuple.writeNumber(nftDistributedRewards);

        const result = await provider.get('get_nft_rewards', tuple.build());
        return result.stack.readBigNumber();
    }

    async getStorageData(provider: ContractProvider) {
        const result = await provider.get('get_storage_data', []);

        return {
            init: result.stack.readNumber(),
            next_item_index: result.stack.readNumber(),
            last_update_time: result.stack.readNumber(),
            nft_item_code: result.stack.readCell(),
            collection_content: result.stack.readCell(),
            last_tvl: result.stack.readBigNumber(),
            distributed_rewards: result.stack.readBigNumber(),
            min_lock_period: result.stack.readNumber(),
            farming_speed: result.stack.readBigNumber(),
            rewards_wallet_address: result.stack.readAddress(), 
            rewards_balance: result.stack.readBigNumber(),
            commission_factor: result.stack.readNumber(),
            lock_wallet_set: result.stack.readNumber(),
            rewards_wallet_set: result.stack.readNumber(),
            premint_open: result.stack.readNumber(), 
            start_time: result.stack.readNumber(),
            end_time: result.stack.readNumber(),
            minimum_deposit: result.stack.readBigNumber(),
            lock_wallet_address: result.stack.readAddress(),
            admin_address: result.stack.readAddress(),
            creator_address:result.stack.readAddress(), 
        };
    }

    async getVersion(provider: ContractProvider) {
        const result = await provider.get('get_version', []);
        return result.stack.readNumber();
    } 
}
