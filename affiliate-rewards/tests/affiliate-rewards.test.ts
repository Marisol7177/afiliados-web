import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { RewardPaid } from "../generated/schema"
import { RewardPaid as RewardPaidEvent } from "../generated/AffiliateRewards/AffiliateRewards"
import { handleRewardPaid } from "../src/affiliate-rewards"
import { createRewardPaidEvent } from "./affiliate-rewards-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let affiliate = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let amount = BigInt.fromI32(234)
    let conversionId = Bytes.fromI32(1234567890)
    let newRewardPaidEvent = createRewardPaidEvent(
      affiliate,
      amount,
      conversionId
    )
    handleRewardPaid(newRewardPaidEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("RewardPaid created and stored", () => {
    assert.entityCount("RewardPaid", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "RewardPaid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "affiliate",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "RewardPaid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )
    assert.fieldEquals(
      "RewardPaid",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "conversionId",
      "1234567890"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
