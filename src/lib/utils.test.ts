import { expect, test, describe } from "bun:test"
import { cn } from "./utils"

describe("cn utility function", () => {
  test("merges Tailwind CSS classes correctly", () => {
    const result = cn("px-2 py-1", "bg-blue-500", "px-4")
    expect(result).toBe("py-1 bg-blue-500 px-4")
  })

  test("handles conditional class names", () => {
    const isTrue = true
    const isFalse = false
    const result = cn("base-class", isTrue && "active-class", isFalse && "inactive-class")
    expect(result).toBe("base-class active-class")
  })

  test("handles empty inputs and arrays", () => {
    const result = cn("font-bold", "", undefined, null, ["p-2", "m-2"])
    expect(result).toBe("font-bold p-2 m-2")
  })
})
