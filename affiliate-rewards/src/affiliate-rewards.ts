import { RewardPaid as RewardPaidEvent } from "../generated/AffiliateRewards/AffiliateRewards"
import { RewardPaid } from "../generated/schema"

export function handleRewardPaid(event: RewardPaidEvent): void {
  let entity = new RewardPaid(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.affiliate = event.params.affiliate
  entity.amount = event.params.amount
  entity.conversionId = event.params.conversionId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
