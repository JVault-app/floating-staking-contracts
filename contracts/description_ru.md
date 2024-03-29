## Есть четыре контракта:

-	[pools_admin.fc](https://github.com/JVault-app/floating-staking-contracts/tree/optimized-draft/contracts/pools_admin.fc)
-	[floating_staking_collection.fc](https://github.com/JVault-app/floating-staking-contracts/tree/optimized-draft/contracts/floating_staking_collection.fc)
-	[nft_item.fc](https://github.com/JVault-app/floating-staking-contracts/tree/optimized-draft/contracts/nft_item.fc)
-   [sharecoms.fc](https://github.com/JVault-app/floating-staking-contracts/tree/optimized-draft/contracts/sharecoms.fc)

## Про первые три

### Для пользователя функционал выглядит так:

Создается стейкинг-пул, создатель добавляет в него награды, из которых формируется доходность для стейкеров и определяет время, за которое эти награды будут распределены. Скорость распределения наград `farming_speed` = `rewards_balance / (end_time - start_time)`. Каждый пользователь получает ежесекундно `farming_speed * user_balance / pool_tvl`, то есть его доход пропорционален его доле в пуле. 
При стейкинге пользователи отправляют жетоны на адрес пула и получают взамен Bond NFT, подтверждающую владение застейканными жетонами (передача NFT равносильна передаче жетонов).

### Схема взаимодействия между контрактами примерно такая:

![Диаграмма без названия drawio(1)](https://i2.paste.pics/20058df62ae5fcbb00eb165a8addc527.png?trs=828277140d6ad8a8ab984b79f338f2e40b70abb5c8577b399bfb1c7b30376429&rand=Q4mFJsYoUh)


1) Пользователь (pool creator) настраивает параметры `start_time`, `end_time`, `minimum_deposit`, `min_lock_period` и указывает, сколько жетонов для наград он хочет добавить в стейкинг-пул. Исходя из ожидаемого TON-эквивалента наград, на бэкенде рассчитывается `commission_factor`. Далее пользователь отправляет запрос на деплой пула, отправляя **100 JVT** с `inner_op = op::deploy_pool` на адрес pool_admin (inner_op - первые 32 бита из forward_payload при трансфере жетона). Pool admin сжигает полученные JVT и деплоит стейкинг-пул.
2) Создатель пула добавляет в него награды, используя трансфер жетона с дополнительным payload, состоящим из `uint32(0xffffffff)` и, опционально, `uint32(new_end_date)` (таймстемп новой даты окончания). В контракте пула проверяется корректность адресов отправителя и отправленного жетона, а также то, что скорость распределения наград (`farming_speed`) не уменьшится вследствие изменения `end_date`. Далее сохраняется новая дата окончания, баланс наград, скорость распределения наград, количество распределенных (не обязательно собранных стейкерами) на текущий момент наград в пересчет на каждые `distributed_rewards_devider` застейканных жетонов, TVL (не изменяется), время последнего обновления данных
3) Любой пользователь может отправить жетоны в стейкинг. Для этого он отправляет их на адрес стейкинг-пула, добавляя в payload период блокировки в секундах (`uint32(lock_period)` ) и, опционально, `uint1(nft_transfer_allowed)`. В контракте пула проверяется, что отправлен правильный жетон, и что `lock_period` не меньше минимального. В случае, если проверка не пройдена, жетоны отправляются обратно юзеру. Иначе, деплоится Bond NFT, в которой сохраняются индекс в коллекции, адрес стейкера (владельца), количество заблокированных жетонов, время начала стейкинга, время разблокировки средств, актуальное для пула количество распределенных наград, количество собранных с этой NFT наград (всегда 0  при деплое), и несколько битов, означающих, последовательно: будет ли доступна передача, будет ли доступен вывод средств по этой NFT (1 для обычных пулов), активна ли NFT (всегда 1 при деплое). В стейкинг-пуле обновляются `next_item_index`, `last_update_time`, `last_tvl`, `distributed_rewards`.
4) Владелец NFT может заклеймить положенные ему награды. В таком случае, он отправляет на контракт NFT `op = op::claim_nft`, NFT присылает сообщение со своими данными контракту коллекции (стейкинг-пула) и запросом на клейм жетонов, в это время она становится неактивной (для предотвращения race condition). Далее в контракте стейкинг-пула высчитываются награды пользователя, как `user_rewards = (pool_distributed_rewards - nft_distributed_rewards) * nft_locked_jettons / distributed_rewards_devider`. Награды отправляются на адрес стейкера, а на адрес NFT отправляется сообщение с `op = op::change_state_nft`. В NFT после этого обновляются `distributed_rewards` и `claimed_rewards`, а также устанавливается значение переменной `is_active = 1`. В cтейкинг-пуле также обновляются `last_update_time`, `distributed_rewards`.
5) После того, как пройдет период блокировки, пользователь может произвести unstake своих жетонов. Процесс аналогичен с предыдущим пунктом, но вместо `op::claim_nft` используется `op::withdraw_nft`, в стейкинг-пуле уменьшается `last_tvl`, а пользователь, помимо наград, получает также свои застейканные жетоны. После unstake NFT становится навсегда неактивной, а ее владельцем становится нулевой адрес. 


## Особеннсоти стейкинга JVT

Стейкеры JVT не только получают процент по своим депозитам, но учавствуют в распределении доходов платформы с комиссий. Для этого реализован контракт "Sharecoms". Для каждого стейкинг-пула, одновременно с его деплоем, деплоится также инстанс `sharecoms`, на который отправляется 50% от комиссий при каждом добавлении наград в стейкинг-пул. Процент от комиссий, предназначенный для каждого стейкера JVT определяется его долей в стейкинг-пуле JVT на момент получения комиссии контрактом `sharecoms`. Чтобы заклеймить свою часть комиссий, юзер должен отправить запрос на адрес Bond NFT, подтверждающую владение застейканными JVT, NFT в свою очередь пересылает запрос на адрес `sharecoms`, и юзер получает свои жетоны. 

### Подробности реализации Sharecoms

#### В контракте хранятся следующие переменные:
1) `pool_address`. Адрес пула, с которого приходят комиссии.
2) `pool_admin_address`. Адрес pool_admin, который задеплоил данный инстанс `sharecoms`.
3) `last_commission_time`. Время прихода последней комиссии на адрес данного контракта.
4) `jvt_staking_address`. Адрес текущего стейкинг-пула JVT, между участниками которого распределяются комиссии.
5) `jetton_wallet_address`. Адрес jetton_wallet, в котором сохраняются пришедшие комиссии.
6) `nft_item_code`. Код JVT bond NFTs. Используется для проверки на валидность отправленных запросов на клейм.
7) `nfts_dict`. Ключ - uint256 часть адреса JVT Bond NFT, значение - время прихода последней заклеймленной этой NFT комиссии. До того, как по какой-то Bond NFT произошел клейм, адреса этой NFT нет в словаре.
8) `commissions_dict`. Ключ - время получения комиссии, значение - сумма пришедших на адрес `sharecoms` комиссий в пересчете на `sharecoms_devider` застейканных JVT. Первый элемент словаря `0: 0`. 
9) Также есть константа `sharecoms_devider` - большое число, являющееся максимальной степенью 10, не превышающей 2 ^ 128, для реализации арифметики над числами с фиксированной точкой (не хранится в c4)
<!-- <br><br> -->

#### Порядок действий с Sharecoms следующий:
1) Одновременно с созданием стейкинг-пула, деплоится также соответствующий контракт `sharecoms`. Для удобства вычисления адреса контракта, в state init в качестве c4 записывается только pool_address и pool_admin_address, все остальные данные записываются в in_msg_body (по аналогии с деплоем NFT в стандартных NFT коллекциях). 
2) При добавлении наград в стейкинг-пул, некоторый процент от них пересылается на pool_admin в качестве комиссии с `inner_op = op::send_commissions` (inner_op - первые 32 бита в forward payload у jetton transfer'а).
    + Далее комиссия распределяется между адресами `team_address`, `conversion_address` (два обычных кошелька) и `sharecoms_address` (адрес контракта `sharecoms`, соответствующего данному стейкинг-пулу)
    + При получении уведомления о приходе комиссии, `sharecoms` запрашивает актуальный TVL стейкинг-пула JVT, отправляя на стейкинг-пул JVT запрос с `op::get_storage_data` и forward payload, содержащим `inner_op = uint32(op::update_sharecoms)` и `commission_amount = coins(transferred_jettons)`.
    + Контракт стейкинг-пула JVT в качестве ответа отправляет на адрес `sharecoms` актуальное значение своего c4 (в с4 содержится значение TVL пула) вместе с полученным forward payload 
    + `Sharecoms` проверяет, что ответ пришел от нужного контракта, а также, что запрос был отправлен самим `sharecoms`, и обновляет `commissions_dict` и `last_commission_time`. В `commissions_dict` записывается пара `(commission_arrival_time, sharecoms_devider * commission_amount / jvt_pool_tvl)`.
3) Владелец JVT Bond NFT может заклеймить свои награды, отправив на адрес NFT сообщение с `op = op::get_storage_data` и списком адресов `sharecoms`, с которых он хочет заклеймить награду. Список реализован в виде HashMapE, в котором ключ - индекс в "списке", значение - адрес `sharecoms`. Количество адресов так же указывается в сообщении и не может превышать 128. `Sharecoms` проверяет, что данные были отправлены от NFT из нужной коллекции, и что NFT активна. После этого `sharecoms` отправляет владельцу NFT его долю комиссий, которая высчитывается следующим образом (с использованием префиксных сумм):
    + `last_claimed_commission_time := nfts_dict.udict_get(nft_address)` - время прихода последней заклеймленной по данной NFT комиссиии. Если клейма по этой NFT еще не было, то `last_claimed_commission_time = max({x ∈ commissions_dict.keys() | x < nft_mint_time})`, то есть last_claimed_commission_time - максимальное время прихода комиссии, меньшее чем время минта NFT.
    + `total_commissions := commissions_dict.get(last_commission_time)` - сколько суммарно комиссий в пересчете на `sharecoms_devider` застейканных JVT пришло на контракт `sharecoms` с деплоя до текущего момента;
    + `claimed_commissions := commissions_dict.get(last_claimed_commission_time)` - сколько комиссий в пересчете на `sharecoms_devider` застейканных JVT пришло на контракт `sharecoms` с деплоя до момента последнего клейма по этой NFT
    + `nft_share := (total_commissions - claimed_commissions) * staked_jvt / sharecoms_devider` - количество жетонов, которые будут отправлены пользователю в качестве его доли от комиссий. Здесь staked_jvt - количество застейканных владельцем NFT токенов JVT (атрибут NFT).

## Общая схема работы контрактов:

![Диаграмма без названия miro(1)](https://i2.paste.pics/6a6319c2ec26ea9c04cffff33324f1e0.png?trs=828277140d6ad8a8ab984b79f338f2e40b70abb5c8577b399bfb1c7b30376429&rand=f8RjEIJ4YX)

