export const Opcodes = {
    // Common
    get_static_data:         0x2fcb26a2,
    report_static_data:      0x8b771735,
    get_storage_data:        0x5b88e5cc,
    report_storage_data:     0xaab4a8ef,
    excesses:                0xd53276db,

    // Jettons
    transfer_jetton:         0xf8a7ea5,
    transfer_notification:   0x7362d09c,
    provide_wallet_address:  0x2c76b973,
    take_wallet_address:     0xd1735400,
    burn_jetton:             0x595f07bc,

    // NFT
    transfer_nft:            0x5fcc3d14,
    ownership_assigned_nft:  0x05138d91,
    claim_nft:               0xa769de27,
    withdraw_nft:            0xb5de5f9e,
    change_state_nft:        0xdca3da4c,

    // NFT-collection
    report_royalty_params:   0xa8cb00ad,
    change_start_time:       0x84d1d850,
    change_lock_period:      0x404e760b,
    premint:                 0x446077df,
    close_premint:           0xcb900de,
    withdraw_rewards:        0x7,
    change_min_deposit:      0x8,
    withdraw_accident_jettons:  0x9,
    change_collection_content:  0x167e65da,

    // Pools admin
    deploy_new_pool:         0xda861f17,
    send_commissions:        0xb96adaea,
    change_host:             0x5369681a,

    // Sharecoms
    update_sharecoms:        0xc482170f,
    claim_commissions:       0xbca8f067,
}


export const Gas = {
    deploy_pool:           120000000n,  //  0.12  TON
    deploy_sharecoms:      95000000n,   //  0.095  TON
    notification:          10000000n,   //  0.01  TON
    provide_addr:          20000000n,   //  0.02  TON
    jetton_transfer:       55000000n,   //  0.055 TON
    burn_jetton:           50000000n,   //  0.05  TON
    stake:                 100000000n,  //  0.10  TON
    change_state_nft:      10000000n,   //  0.01  TON
    claim_nft:             200000000n,  //  0.20  TON
    withdraw_nft:          300000000n,  //  0.30  TON
    min_tons_for_storage:  50000000n,   //  0.05  TON
    update_sharecoms:      50000000n,   //  0.05  TON

    receive_commissions:   225000000n,  //  0.225 TON
    send_commissions:      270000000n,  //  0.27  TON

}
