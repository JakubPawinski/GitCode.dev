export enum SubmissionStatus {
  /**
   * IN_PROGRESS
   * - User has started working on the problem
   * - Code has been saved in the editor but not yet submitted
   * - No test execution has occurred
   * - User can continue editing the code
   */
  IN_PROGRESS = 'in_progress',

  /**
   * SUBMITTED
   * - User has submitted the code for testing
   * - Tests have been executed but NOT all passed
   * - At least one test case failed
   * - User can edit the code and resubmit
   * - Last attempt details available in attempts array
   */
  SUBMITTED = 'submitted',

  /**
   * ACCEPTED
   * - User has submitted the code for testing
   * - ALL test cases have PASSED ✅
   * - Problem is considered "solved" by this user
   * - acceptedAt timestamp is set
   * - User can still view code and test results
   * - User CAN resubmit if they want to optimize (will create new attempt)
   */
  ACCEPTED = 'accepted',
}
