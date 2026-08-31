import { describe, expect, test } from "bun:test"
import { cn } from "./utils"

describe("utils cn helper", () => {
  test("combines class names cleanly", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1")
  })

  test("handles tailwind class merges correctly", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  test("handles conditional class names", () => {
    expect(cn("base-class", false && "hidden", true && "visible")).toBe("base-class visible")
  })
})
