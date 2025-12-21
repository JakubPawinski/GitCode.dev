export enum AttemptStatus {
  /**
   * PENDING
   * - Attempt has been created
   * - Job is waiting in the queue to be processed
   * - Code execution has not started yet
   * - User can see queue position and estimated wait time in websocket
   */
  PENDING = 'pending',

  /**
   * RUNNING
   * - Job is currently being processed
   * - Code is being executed against test cases
   * - Real-time progress might be shown to user
   */
  RUNNING = 'running',

  /**
   * SUCCESS
   * - Code execution completed successfully
   * - ALL test cases PASSED ✅
   * - passedTests === totalTests
   * - executionTime and other metrics are available
   * - Related userSubmission.status = 'accepted'
   */
  SUCCESS = 'success',

  /**
   * FAILED
   * - Code execution completed successfully
   * - At least ONE test case FAILED ❌
   * - failedTests > 0
   * - failedTestsDetails contains information about failed tests
   * - Related userSubmission.status = 'submitted'
   * - User can fix the code and submit again
   */
  FAILED = 'failed',

  /**
   * ERROR
   * - Code execution encountered an error
   * - Possible causes:
   *   - Syntax error in code
   *   - Runtime error (crash, exception)
   *   - Timeout (code took too long)
   *   - Memory limit exceeded
   *   - Docker/execution environment error
   * - errorMessage contains error details
   * - Related userSubmission.status = 'submitted'
   * - User should fix the code and resubmit
   */
  ERROR = 'error',
}
