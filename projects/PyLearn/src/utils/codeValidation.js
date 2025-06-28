import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

/**
 * Simulates code execution and provides feedback based on expected output.
 * In a real application, the `submittedCode` would be sent to a backend
 * for secure Python execution, and the actual output would be returned.
 *
 * @param {string} submittedCode The code submitted by the user.
 * @param {string} expectedOutput The expected output for the level.
 * @returns {{isCorrect: boolean, feedback: string, actualOutput: string}}
 */
export const validateCode = (submittedCode, expectedOutput) => {
  // For client-side simulation, we're treating submittedCode as its own output.
  // In a real scenario, 'actualOutput' would come from a backend.
  const actualOutput = submittedCode.trim(); 
  const cleanExpectedOutput = expectedOutput.trim();

  const isCorrect = actualOutput.includes(cleanExpectedOutput);

  let feedback = '';
  if (isCorrect) {
    feedback = "🎉 Correct! Great job!";
  } else {
    const diff = dmp.diff_main(cleanExpectedOutput, actualOutput);
    dmp.diff_cleanupSemantic(diff);
    const diffHtml = dmp.diff_prettyHtml(diff);

    feedback = `❌ Incorrect. Here's a comparison:

<div class="diff-viewer">${diffHtml}</div>

Review your code and try again!`;
  }

  return { isCorrect, feedback, actualOutput };
};
