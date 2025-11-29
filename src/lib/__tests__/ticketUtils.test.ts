import { normalizeTicketId } from "../ticketUtils";

describe("normalizeTicketId", () => {
  it("returns empty string for falsy or whitespace", () => {
    expect(normalizeTicketId("")).toBe("");
    expect(normalizeTicketId("   ")).toBe("");
    expect(normalizeTicketId(undefined as any)).toBe("");
  });

  it("prefixes with # when missing", () => {
    expect(normalizeTicketId("123")).toBe("#123");
    expect(normalizeTicketId(" 456 ")).toBe("#456");
  });

  it("keeps existing #", () => {
    expect(normalizeTicketId("#789")).toBe("#789");
  });
});
