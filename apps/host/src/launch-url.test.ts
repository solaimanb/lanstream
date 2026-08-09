import { describe, expect, it } from "vitest";
import { portalUrlFromLaunchArguments } from "./launch-url";

describe("portalUrlFromLaunchArguments", () => {
  it("reads the portal from a desktop protocol launch", () => {
    expect(
      portalUrlFromLaunchArguments([
        "lanstream://pair?portal=http%3A%2F%2Flocalhost%3A3000%2F",
      ]),
    ).toBe("http://localhost:3000");
  });

  it("ignores unrelated and unsafe URLs", () => {
    expect(portalUrlFromLaunchArguments(["--help"])).toBeUndefined();
    expect(
      portalUrlFromLaunchArguments([
        "lanstream://pair?portal=file%3A%2F%2F%2Ftmp%2Fportal",
      ]),
    ).toBeUndefined();
    expect(
      portalUrlFromLaunchArguments([
        "lanstream://different?portal=http%3A%2F%2Flocalhost%3A3000",
      ]),
    ).toBeUndefined();
  });
});
