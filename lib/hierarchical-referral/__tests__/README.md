# Hierarchical Referral Program - Test Suite

This directory contains comprehensive tests for the Hierarchical Referral Program, covering all aspects from unit tests to end-to-end integration and performance testing.

## Test Structure

### 1. Unit Tests
- **referral-code-system.test.ts** - Property-based tests for referral code generation and validation
- **dashboard-aggregation.test.ts** - Property-based tests for dashboard data aggregation
- **data-model-validation.test.ts** - Tests for data model validation and integrity
- **hierarchical-linking.test.ts** - Tests for influencer hierarchy establishment
- **notification-system.test.ts** - Tests for notification delivery and preferences
- **payout-processing.test.ts** - Tests for automated payout processing
- **admin-controls.test.ts** - Tests for admin management capabilities

### 2. Integration Tests
- **end-to-end-integration.test.ts** - Complete user flow testing from signup to payout
  - API endpoint integration
  - Real-time data flow
  - Error handling integration
  - Data consistency across components

### 3. Performance Tests
- **performance-load.test.ts** - Performance and scalability testing
  - Dashboard performance with large datasets
  - Real-time update latency verification
  - Concurrent user handling
  - Database query optimization
  - Memory usage and garbage collection

### 4. Service Tests
- **services/__tests__/** - Individual service unit tests
  - Analytics service tests
  - Commission service tests
  - Activity tracking service tests
  - Mini influencer auth service tests

## Running Tests

### Quick Start
```bash
# Run all tests
./run-all-tests.sh

# Run specific test categories
npx vitest run lib/hierarchical-referral/__tests__/end-to-end-integration.test.ts --run
npx vitest run lib/hierarchical-referral/__tests__/performance-load.test.ts --run
npx vitest run lib/hierarchical-referral/__tests__/referral-code-system.test.ts --run
```

### Individual Test Commands
```bash
# Unit tests
npx vitest run lib/hierarchical-referral/__tests__/referral-code-system.test.ts --run
npx vitest run lib/hierarchical-referral/__tests__/dashboard-aggregation.test.ts --run

# Integration tests
npx vitest run lib/hierarchical-referral/__tests__/end-to-end-integration.test.ts --run

# Performance tests (with extended timeout)
npx vitest run lib/hierarchical-referral/__tests__/performance-load.test.ts --run --testTimeout=60000
```

## Test Coverage

### Property-Based Testing
The test suite uses **fast-check** for property-based testing, ensuring that the system behaves correctly across a wide range of inputs:

- **37 Properties** covering all system requirements
- **Minimum 100 iterations** per property test
- **Automatic shrinking** to find minimal failing examples

### Requirements Coverage
All 10 main requirements are covered by corresponding properties:

1. **Referral Code Management** - Properties 1, 2, 3, 4, 5, 7, 8
2. **Multi-Level User Registration** - Properties 6, 7, 8
3. **Mother Influencer Dashboard** - Properties 9, 10, 11, 12
4. **Activity Metrics and Tracking** - Properties 13, 14, 15, 16
5. **Commission and Earnings Management** - Properties 17, 18, 19, 20
6. **Admin Dashboard and Controls** - Properties 21, 22, 23, 24, 25
7. **Real-Time Performance Analytics** - Properties 26, 27
8. **Automated Payout Processing** - Properties 28, 29, 30, 31, 32
9. **Modern UI/UX Design** - Covered by integration tests
10. **Notification and Communication System** - Properties 33, 34, 35, 36, 37

### Integration Testing
- **4 comprehensive integration tests** covering complete user flows
- **API endpoint integration** testing
- **Real-time data flow** verification
- **Error handling and recovery** testing
- **Data consistency** across all system components

### Performance Testing
- **5 performance test categories** with realistic load simulation
- **Dashboard performance** testing with datasets up to 10,000 records
- **Real-time update latency** verification (5-minute maximum requirement)
- **Concurrent user handling** up to 50 simultaneous users
- **Database query optimization** testing
- **Memory usage and garbage collection** monitoring

## Test Configuration

### Timeouts
- **Unit tests**: 10 seconds
- **Integration tests**: 15 seconds
- **Performance tests**: 60 seconds

### Property Test Settings
- **Iterations**: 100 per property (minimum)
- **Shrinking**: Enabled for minimal counterexamples
- **Seed**: Randomized for each run

### Mock Configuration
- **Firebase Admin**: Fully mocked with realistic latency simulation
- **External APIs**: Mocked with configurable response times
- **Database operations**: Simulated with appropriate delays

## Continuous Integration

### Pre-deployment Checklist
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Performance tests meet latency requirements
- [ ] No memory leaks detected
- [ ] All property tests pass with 100+ iterations

### Test Automation
The test suite is designed for CI/CD integration:
- **Exit codes**: 0 for success, 1 for failure
- **Structured output**: Clear pass/fail indicators
- **Performance metrics**: Logged for monitoring
- **Coverage reports**: Generated automatically

## Debugging Failed Tests

### Property-Based Test Failures
When a property test fails, fast-check provides:
- **Counterexample**: The specific input that caused the failure
- **Shrunk example**: The minimal failing case
- **Seed**: For reproducing the exact failure

### Integration Test Failures
- Check **mock configurations** for correct responses
- Verify **API endpoint** implementations
- Review **data flow** between components

### Performance Test Failures
- Monitor **system resources** during test execution
- Check **timeout configurations** for realistic values
- Review **concurrent load** patterns

## Best Practices

### Writing New Tests
1. **Use property-based testing** for universal properties
2. **Use unit tests** for specific examples and edge cases
3. **Mock external dependencies** appropriately
4. **Test error conditions** as well as success paths
5. **Verify data consistency** across components

### Maintaining Tests
1. **Update tests** when requirements change
2. **Keep mocks** synchronized with real implementations
3. **Monitor performance** test thresholds
4. **Review failing tests** promptly
5. **Document test changes** in commit messages

## Troubleshooting

### Common Issues
- **Timeout errors**: Increase test timeout or optimize test logic
- **Mock failures**: Verify mock configurations match expected calls
- **Memory issues**: Check for memory leaks in test data generation
- **Flaky tests**: Add appropriate delays or improve test isolation

### Getting Help
- Review test logs for detailed error messages
- Check the property test counterexamples for insights
- Verify system requirements are met
- Consult the design document for expected behavior

## Performance Benchmarks

### Expected Performance
- **Dashboard load**: < 2 seconds for large datasets
- **Real-time updates**: < 30 seconds average latency
- **Concurrent users**: 50+ users without degradation
- **Database queries**: < 500ms for complex aggregations
- **Memory usage**: < 200MB under normal load

### Monitoring
Performance metrics are logged during test execution for continuous monitoring and optimization.