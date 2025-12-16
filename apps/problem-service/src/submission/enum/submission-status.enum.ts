export enum SubmissionStatus {
  /**
   * IN_PROGRESS
   * - Submission is being processed (e.g., code has been submitted and is currently being tested)
   * - Tests may be running or queued, and results are not yet available
   * - User cannot submit again until processing is complete
   * - This status is set when it is submitted for testing
   */
  IN_PROGRESS = 'in_progress',

  /**
   * SUBMITTED
   * - User has submitted the code for testing
   * - Tests have been executed but NOT all passed
   * - At least one test case failed
   * - Error may have occurred
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
