import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { RewardPaid } from "../generated/AffiliateRewards/AffiliateRewards"

export function createRewardPaidEvent(
  affiliate: Address,
  amount: BigInt,
  conversionId: Bytes
): RewardPaid {
  let rewardPaidEvent = changetype<RewardPaid>(newMockEvent())

  rewardPaidEvent.parameters = new Array()

  rewardPaidEvent.parameters.push(
    new ethereum.EventParam("affiliate", ethereum.Value.fromAddress(affiliate))
  )
  rewardPaidEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  rewardPaidEvent.parameters.push(
    new ethereum.EventParam(
      "conversionId",
      ethereum.Value.fromFixedBytes(conversionId)
    )
  )

  return rewardPaidEvent
}
