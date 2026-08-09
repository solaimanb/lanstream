# LANStream Release Process

## Versioning

LANStream uses semantic versioning:

- **Major**: Breaking changes to API or data model
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, security updates

## Release Steps

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Build and test
5. Deploy portal
6. Publish host release

## Portal Deployment

1. Run full test suite
2. Build production: `pnpm build`
3. Build Docker image
4. Push to registry
5. Deploy to production

## Host Release

1. Run E2E tests
2. Build Node.js application
3. Package the host with OS integration:
   - Linux: install the systemd user service and `lanstream://` desktop handler
   - macOS: install the launchd agent and URL scheme application registration
   - Windows: install the user service and URL protocol registry entry
4. Verify first-launch browser approval and login auto-start
5. Create GitHub release
6. Update auto-updater endpoint

## Rollback

- Portal: redeploy previous Docker image
- Host: users can downgrade via installer
