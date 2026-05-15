import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Bytes, Address, BigInt } from "@graphprotocol/graph-ts"
import { ClickRegistered } from "../generated/schema"
import { ClickRegistered as ClickRegisteredEvent } from "../generated/ClickTracker/ClickTracker"
import { handleClickRegistered } from "../src/click-tracker"
import { createClickRegisteredEvent } from "./click-tracker-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let clickId = Bytes.fromI32(1234567890)
    let user = Address.fromString("0x0000000000000000000000000000000000000001")
    let ref = "Example string value"
    let timestamp = BigInt.fromI32(234)
    let newClickRegisteredEvent = createClickRegisteredEvent(
      clickId,
      user,
      ref,
      timestamp
    )
    handleClickRegistered(newClickRegisteredEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("ClickRegistered created and stored", () => {
    assert.entityCount("ClickRegistered", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ClickRegistered",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "clickId",
      "1234567890"
    )
    assert.fieldEquals(
      "ClickRegistered",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "user",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ClickRegistered",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "ref",
      "Example string value"
    )
    assert.fieldEquals(
      "ClickRegistered",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "timestamp",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
