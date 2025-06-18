
document.addEventListener(DOMContentLoaded, () => {
    console.log("Simplified Distillation Simulator JS Loaded");

    const feedCompositionSlider = document.getElementById(feedComposition);
    const feedCompositionInput = document.getElementById(feedCompositionInput);
    const feedCompositionValueDisplay = document.getElementById(feedCompositionValue);

    if (feedCompositionSlider && feedCompositionInput && feedCompositionValueDisplay) {
        console.log("Feed composition elements found.");

        feedCompositionSlider.addEventListener(input, (e) => {
            const value = parseFloat(e.target.value);
            console.log("Feed composition slider changed to: ", value);

            if (feedCompositionInput) {
                feedCompositionInput.value = value.toFixed(3);
            }
            if (feedCompositionValueDisplay) {
                feedCompositionValueDisplay.textContent = value.toFixed(3);
            }
        });

        // Initialize display just in case
        const initialValue = parseFloat(feedCompositionSlider.value);
        if (feedCompositionInput) {
            feedCompositionInput.value = initialValue.toFixed(3);
        }
        if (feedCompositionValueDisplay) {
            feedCompositionValueDisplay.textContent = initialValue.toFixed(3);
        }
        console.log("Initial feed composition value set to: ", initialValue);

    } else {
        console.error("Error: One or more feed composition elements not found!");
        if (!feedCompositionSlider) console.error("feedComposition slider missing");
        if (!feedCompositionInput) console.error("feedCompositionInput input missing");
        if (!feedCompositionValueDisplay) console.error("feedCompositionValue display missing");
    }

    // Test a button - e.g. Reset button
    const resetBtn = document.getElementById(resetBtn);
    if (resetBtn) {
        console.log("Reset button found.");
        resetBtn.addEventListener(click, () => {
            console.log("Reset button clicked (simplified JS)!");
            // For this test, just log. Actual reset logic is removed.
            alert("Reset button clicked (Test Mode)!");
        });
    } else {
        console.error("Reset button not found.");
    }
});
