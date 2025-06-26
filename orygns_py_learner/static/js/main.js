// OrygnsPyLearner - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    console.log('OrygnsPyLearner JS Loaded');

    // Overall progress bar update
    const overallProgressBar = document.getElementById('overallProgressBar');
    const progressDataElement = document.getElementById('userProgressData');

    if (overallProgressBar && progressDataElement) {
        try {
            const progressData = JSON.parse(progressDataElement.textContent);
            const completedCount = progressData.completed_levels_count || 0;
            const totalLevels = progressData.total_levels_count || 0;

            if (totalLevels > 0) {
                const progressPercentage = (completedCount / totalLevels) * 100;
                overallProgressBar.style.width = progressPercentage + '%';
            } else {
                overallProgressBar.style.width = '0%';
            }
        } catch (e) {
            console.error("Error parsing user progress data:", e);
            overallProgressBar.style.width = '0%';
        }
    }

    // More interactivity will be added here
});
