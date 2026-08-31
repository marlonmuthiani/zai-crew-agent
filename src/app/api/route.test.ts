import { describe, expect, test } from "bun:test"
import { GET } from "./route"

describe("Root API Route", () => {
  test("returns hello world message", async () => {
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toEqual({ message: "Hello, world!" })
  })
})
