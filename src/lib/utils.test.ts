import { describe, test, expect } from "bun:test"
import { cn } from "./utils"

describe("cn utility function", () => {
  test("merges class names correctly", () => {
    const result = cn("px-2 py-1", "bg-blue-500", { "text-white": true, "hidden": false })
    expect(result).toBe("px-2 py-1 bg-blue-500 text-white")
  })

  test("handles tailwind class conflicts", () => {
    const result = cn("p-4", "p-2")
    expect(result).toBe("p-2")
  })
})
