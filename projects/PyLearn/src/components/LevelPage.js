import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { usePyLearn } from '../context/PyLearnContext';
import { useSnackbar } from '../context/SnackbarContext';
import { levels as allLevels } from '../data/levels.js'; 
import { validateCode } from '../utils/codeValidation'; 

function LevelPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { updateLevelProgress, getLevelStatus, streak } = usePyLearn();
  const { showSnackbar } = useSnackbar();

  const level = allLevels.find(lvl => lvl.id === parseInt(levelId));

  const [code, setCode] = useState(level ? level.initialCode : '');
  const [output, setOutput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);

  useEffect(() => {
    if (!level) {
      navigate('/'); 
      return;
    }
    setCode(level.initialCode);
    setOutput('');
    setFeedback('');
    setIsCorrect(false);
    setShowHint(false);
    setHintStep(0);
    setIsLevelCompleted(getLevelStatus(level.id));
  }, [levelId, level, navigate, getLevelStatus]);

  const handleSubmit = () => {
    const { isCorrect: validationCorrect, feedback: validationFeedback, actualOutput: validationOutput } =
      validateCode(code, level.expectedOutput);

    setIsCorrect(validationCorrect);
    setFeedback(validationFeedback);
    setOutput(validationOutput);

    if (validationCorrect) {
      updateLevelProgress(level.id, true);
      setIsLevelCompleted(true);
      showSnackbar('Level ' + level.id + ' Completed!', 'success');
    } else {
      updateLevelProgress(level.id, false);
      showSnackbar('Incorrect answer, try again.', 'error');
    }
  };

  const handleReset = () => {
    setCode(level.initialCode);
    setOutput('');
    setFeedback('');
    setIsCorrect(false);
    setShowHint(false);
    setHintStep(0);
    showSnackbar('Level reset!', 'info');
  };

  const handleHint = () => {
    if (hintStep < level.hints.length) {
      setShowHint(true);
      setHintStep(prev => prev + 1);
      showSnackbar('Hint revealed!', 'info');
    } else {
      showSnackbar('No more hints available.', 'warning');
    }
  };

  const handleNextLevel = () => {
    const nextLevelId = level.id + 1;
    const nextLevel = allLevels.find(lvl => lvl.id === nextLevelId);
    if (nextLevel) {
      navigate(`/level/${nextLevelId}`);
    } else {
      navigate('/'); 
      showSnackbar("Congratulations! You've completed all levels!", 'success');
    }
  };

  if (!level) {
    return (
      <div className="text-center text-red-500 text-xl">Level not found. Redirecting...</div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 lg:p-10 mb-8"
    >
      <h2 className="text-3xl font-bold text-teal-400 mb-4">{level.title}</h2>
      <p className="text-gray-300 mb-6 leading-relaxed">{level.task}</p>

      {/* Streak Display */}
      <motion.div 
        className="text-center bg-gray-700 text-purple-300 font-semibold py-2 px-4 rounded-lg mb-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        Current Streak: {streak}
      </motion.div>

      {/* Code Editor */}
      <div className="mb-6 bg-gray-900 rounded-md overflow-hidden shadow-inner">
        <SyntaxHighlighter
          language="python"
          style={dracula}
          showLineNumbers
          customStyle={{ padding: '20px', borderRadius: '0.375rem' }}
          wrapLines={true}
          lineProps={lineNumber => ({
            style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' },
          })}
        >
          {code}
        </SyntaxHighlighter>
        <textarea
          className="w-full p-4 bg-gray-900 text-gray-100 border-t border-gray-700 focus:outline-none focus:border-purple-500 font-mono text-sm resize-y"
          rows="10"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck="false"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        {!isLevelCompleted && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-300"
          >
            Run & Submit
          </motion.button>
        )}
        {isCorrect && level.id < allLevels.length && (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextLevel}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-300"
            >
                Next Level ▶
            </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleHint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-300"
        >
          Hint ({level.hints.length - hintStep} left)
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-300"
        >
          Reset Level
        </motion.button>
      </div>

      {/* Hints Display */}
      {showHint && hintStep > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.4 }}
          className="bg-blue-900 bg-opacity-30 border border-blue-700 text-blue-200 p-4 rounded-md mb-6 shadow-lg"
        >
          <h3 className="font-semibold mb-2 text-blue-100">Hint {hintStep}:</h3>
          <p>{level.hints[hintStep - 1]}</p>
        </motion.div>
      )}

      {/* Output and Feedback */}
      {(output || feedback) && (
        <div className="bg-gray-900 rounded-md p-4 shadow-inner mt-6">
          <h3 className="text-xl font-bold mb-2 text-purple-400">Output & Feedback:</h3>
          {output && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-300">Your Program Output:</h4>
              <pre className="bg-gray-700 p-3 rounded-md text-sm whitespace-pre-wrap break-all">
                {output}
              </pre>
            </div>
          )}
          {feedback && (
            <div>
              <h4 className="font-semibold text-gray-300">Feedback:</h4>
              <pre className={`p-3 rounded-md text-sm whitespace-pre-wrap break-all ${isCorrect ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                {feedback}
              </pre>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default LevelPage;
