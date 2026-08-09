import { expect, test } from "@playwright/test";

test("owner pairs an agent and automatically starts an assigned server", async ({
  page,
  request,
}) => {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("E2E Owner");
  await page.getByLabel("Email").fill(`e2e-${unique}@example.com`);
  await page.getByLabel("Password").fill("StrongPass123!");
  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

  const agentInfo = {
    hostname: "e2e-host",
    platform: "test/x64",
    version: "1.0.0",
    localIp: "127.0.0.1",
  };
  const pairingStart = await request.post("/api/agent/pair/start", {
    data: {
      requestedName: `E2E Host ${unique}`,
      hostDeviceInfo: agentInfo,
    },
  });
  expect(pairingStart.status()).toBe(200);
  const pairing = (await pairingStart.json()) as {
    data: { pairingSecret: string; verificationUrl: string };
  };
  await page.goto(pairing.data.verificationUrl);
  await page.getByRole("button", { name: "Approve Host" }).click();
  await expect(page.getByRole("button", { name: "Connected" })).toBeVisible();

  const pairingPoll = await request.post("/api/agent/pair/poll", {
    headers: { Authorization: `Bearer ${pairing.data.pairingSecret}` },
  });
  expect(pairingPoll.status()).toBe(200);
  const paired = (await pairingPoll.json()) as {
    data: { token: string };
  };
  const token = paired.data.token;
  expect(token).toMatch(/^lansta_/);

  const connect = await request.post("/api/agent/heartbeat", {
    headers: { Authorization: `Bearer ${token}` },
    data: { hostDeviceInfo: agentInfo, servers: [] },
  });
  expect(connect.status()).toBe(200);
  await expect(connect.json()).resolves.toMatchObject({
    data: { acknowledged: true, assignments: [] },
  });

  await page.getByRole("link", { name: "New Server" }).first().click();
  await page.getByLabel("Server Name").fill(`E2E Server ${unique}`);
  await page
    .getByLabel("Media Directory Path")
    .fill("/tmp/lanstream-e2e-media");
  await page.getByRole("button", { name: "Create and Start Server" }).click();
  await expect(page).toHaveURL(/\/servers\/[0-9a-f-]+$/);
  const serverId = page.url().split("/").at(-1)!;
  await expect(page.getByText("starting", { exact: true })).toBeVisible();

  const reconcile = await request.post("/api/agent/heartbeat", {
    headers: { Authorization: `Bearer ${token}` },
    data: { hostDeviceInfo: agentInfo, servers: [] },
  });
  expect(reconcile.status()).toBe(200);
  const reconcilePayload = (await reconcile.json()) as {
    data: {
      assignments: Array<{
        serverId: string;
        mediaPath: string;
        port: number;
        desiredState: string;
      }>;
    };
  };
  expect(reconcilePayload.data.assignments).toEqual([
    expect.objectContaining({
      serverId,
      mediaPath: "/tmp/lanstream-e2e-media",
      port: 4780,
      desiredState: "running",
    }),
  ]);

  const report = await request.post("/api/agent/heartbeat", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      hostDeviceInfo: agentInfo,
      servers: [{ serverId, status: "online", port: 4780 }],
    },
  });
  expect(report.status()).toBe(200);
  await expect(page.getByText("online", { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole("link", { name: "Access Links" }).click();
  await page.getByRole("button", { name: "Create Guest Link" }).first().click();
  await expect(page.getByLabel("New guest share link")).toHaveValue(
    /^http:\/\/127\.0\.0\.1:4780\/watch#/,
  );
});
