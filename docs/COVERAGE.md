# Code Coverage

## Running Coverage

To generate coverage reports for the TranscriptRegistry contract:
```bash
forge coverage --report lcov
```

## Viewing Coverage Reports

Generate HTML report:
```bash
genhtml lcov.info -o coverage --branch-coverage
```

Then open `coverage/index.html` in your browser.

## Quick Summary
```bash
forge coverage --report summary
```

## Notes

- The upgradeable contracts (TranscriptRegistryUpgradeable, UniversityFactoryBeacon) may have compilation issues in coverage mode due to optimizer being disabled
- For full coverage including upgradeable contracts, temporarily exclude them or use `--ir-minimum` flag
- Main TranscriptRegistry contract coverage is fully supported

## Excluded from Coverage

When running coverage, these files may need to be temporarily renamed:
- `src/UniversityFactoryBeacon.sol`
- `script/TestDeployedContracts.s.sol`
- `script/DeployBeacon.s.sol`
- `test/UniversityFactoryBeacon.t.sol`
- `test/TranscriptUpgradeable.t.sol`
