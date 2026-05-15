import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, Address, BigInt } from "@graphprotocol/graph-ts"
import { ClickRegistered } from "../generated/ClickTracker/ClickTracker"

export function createClickRegisteredEvent(
  clickId: Bytes,
  user: Address,
  ref: string,
  timestamp: BigInt
): ClickRegistered {
  let clickRegisteredEvent = changetype<ClickRegistered>(newMockEvent())

  clickRegisteredEvent.parameters = new Array()

  clickRegisteredEvent.parameters.push(
    new ethereum.EventParam("clickId", ethereum.Value.fromFixedBytes(clickId))
  )
  clickRegisteredEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  clickRegisteredEvent.parameters.push(
    new ethereum.EventParam("ref", ethereum.Value.fromString(ref))
  )
  clickRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return clickRegisteredEvent
}
