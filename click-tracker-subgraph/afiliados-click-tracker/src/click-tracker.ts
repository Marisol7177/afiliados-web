import { ClickRegistered as ClickRegisteredEvent } from "../generated/ClickTracker/ClickTracker"
import { ClickRegistered } from "../generated/schema"

export function handleClickRegistered(event: ClickRegisteredEvent): void {
  let entity = new ClickRegistered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.clickId = event.params.clickId
  entity.user = event.params.user
  entity.ref = event.params.ref
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
