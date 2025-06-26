# Flask App Initialization
from flask import Flask, jsonify, render_template, request
import os # For secret key

app = Flask(__name__)

# It's good practice to set a secret key, especially if you plan to use sessions/flash messages.
# For production, use a strong, randomly generated key and keep it secret (e.g., environment variable).
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'a_default_dev_secret_key_change_me')


# --- Data Model (In-memory for now) ---
levels_data = [ # Renamed to avoid conflict with a potential 'levels' route
    {
        "id": 1,
        "title": "Hello, World!",
        "task": "Write a Python program that prints 'Hello, World!' to the console.",
        "educational_context": "The `print()` function in Python is used to display output to the screen. Text that you want to print should be enclosed in quotes (e.g., \"Hello, World!\").",
        "initial_code": "# Your code here\nprint(\"\")",
        "expected_output": "Hello, World!\n",
        "hints": [
            "Remember to use the `print()` function.",
            "Make sure the text 'Hello, World!' is exactly as shown, including capitalization and punctuation."
        ],
        "unlocked": True, # To control access
        "completed": False
    },
    {
        "id": 2,
        "title": "Variables",
        "task": "Create a variable named `message` and assign it the value 'Python is fun!'. Then print the value of the variable.",
        "educational_context": "Variables are used to store data. You can assign a value to a variable using the `=` operator. For example, `my_variable = 10`.",
        "initial_code": "# Your code here\nmessage = \"\"\nprint(message)",
        "expected_output": "Python is fun!\n",
        "hints": [
            "First, assign the string 'Python is fun!' to a variable called `message`.",
            "Then, use the `print()` function to display the content of the `message` variable."
        ],
        "unlocked": False,
        "completed": False
    },
    {
        "id": 3,
        "title": "Basic Arithmetic",
        "task": "Write a Python program that calculates the sum of 15 and 27, and then prints the result.",
        "educational_context": "Python can perform arithmetic operations like addition (+), subtraction (-), multiplication (*), and division (/). Parentheses can be used to group operations.",
        "initial_code": "# Your code here\nresult = 0\nprint(result)",
        "expected_output": "42\n",
        "hints": [
            "Use the `+` operator for addition.",
            "Store the sum in a variable before printing, or print the calculation directly."
        ],
        "unlocked": False,
        "completed": False
    },
    {
        "id": 4,
        "title": "User Input",
        "task": "Write a Python program that asks the user for their name and then prints a greeting message 'Hello, [name]!', where [name] is the name entered by the user.",
        "educational_context": "The `input()` function is used to get input from the user. It returns the input as a string. You can provide a prompt message within the parentheses of `input()`.",
        "initial_code": "# Your code here\nname = \"\"\nprint(\"Hello, \" + name + \"!\")",
        "expected_output": "Hello, TestUser!\n", # Note: For testing, we need a predictable input.
                                                # Real input() would require more complex testing or specific instructions.
                                                # For this exercise, we'll assume the code is tested as if 'TestUser' was typed.
                                                # Or, the problem could be rephrased to assign a fixed string.
                                                # Let's rephrase for simplicity of testing.
        "task_revised": "Write a Python program that assigns the string 'TestUser' to a variable `user_name`. Then, print a greeting message 'Hello, TestUser!', using the `user_name` variable.",
        "initial_code_revised": "user_name = \"TestUser\" \n# Now print the greeting using the user_name variable\n",
        "expected_output_revised": "Hello, TestUser!\n",

        "task_original": "Write a Python program that asks the user for their name and then prints a greeting message 'Hello, [name]!', where [name] is the name entered by the user. For this exercise, assume the user will type 'TestUser'.",
        "educational_context_original": "The `input()` function is used to get input from the user. It returns the input as a string. You can provide a prompt message within the parentheses of `input()`. When testing code that uses `input()`, the testing environment often provides predefined input.",
        "initial_code_original": "# Your code here\n# name = input(\"Enter your name: \") \n# print(\"Hello, \" + name + \"!\")",

        # Sticking to the original task formulation for now and will handle input during execution testing if possible,
        # or adjust the expected output/test mechanism later. For now, the `execute_python_code`
        # doesn't support providing stdin. This level will be hard to auto-validate as is.
        #
        # To make it auto-gradable with current setup:
        # Task: "Simulate asking for a name. Assign 'TestUser' to a variable `name`. Print 'Hello, TestUser!'."
        "task": "Assign the string 'TestUser' to a variable `name`. Then, print a greeting message 'Hello, [name]!', replacing [name] with the value of your variable.",
        "educational_context": "The `input()` function is typically used to get input from the user. However, for this exercise, we will simulate this by assigning a specific value to a variable. Remember string concatenation to build the final message.",
        "initial_code": "# Assign 'TestUser' to a variable named 'name'\n\n# Print the greeting message",
        "expected_output": "Hello, TestUser!\n",
        "hints": [
            "Create a variable, for example `name`.",
            "Assign the exact string 'TestUser' to it.",
            "Use the `print()` function and string concatenation (`+`) or f-strings (e.g. `f\"Hello, {name}!\"`) to form the greeting."
        ],
        "unlocked": False,
        "completed": False
    },
    {
        "id": 5,
        "title": "Conditional Statements",
        "task": "Write a Python program that defines a variable `age` and sets it to 18. If `age` is 18 or greater, print 'Adult'. Otherwise, print 'Minor'.",
        "educational_context": "Conditional statements like `if`, `elif` (else if), and `else` allow your program to make decisions. The code inside an `if` block runs if its condition is true. The `else` block runs if the `if` condition is false.",
        "initial_code": "age = 18\n# Your code here\n\n",
        "expected_output": "Adult\n",
        "hints": [
            "Use an `if` statement to check the condition `age >= 18`.",
            "Use an `else` statement for the alternative case.",
            "Ensure your `print()` statements are correctly indented within the `if` and `else` blocks."
        ],
        "unlocked": False,
        "completed": False
    }
    # ... More levels will be added here (up to 15)
]

# --- User Progress (In-memory for now) ---
user_progress = {
    "current_level": 1,
    "completed_levels": [], # List of level IDs
    "streak": 0,
    "badges": []
}

# --- Routes ---
@app.route('/')
def home_page():
    return render_template('home.html') # user_progress and levels_data injected

@app.route('/levels')
def level_selector_page():
    # Pass all levels, their unlocked status, and completion status
    return render_template('level_selector.html') # user_progress and levels_data injected

@app.route('/level/<int:level_id>')
def get_level_page(level_id):
    level = next((l for l in levels_data if l["id"] == level_id), None)
    if not level:
        return render_template('404.html'), 404 # Or a more specific error page

    if not level["unlocked"] and level_id != 1: # Allow access to level 1 always, or based on logic
        # Flash a message or redirect
        # For now, just showing a simple error.
        # In a real app, you might redirect to level_selector_page with a message.
        return render_template('error.html', message="This level is currently locked."), 403

    return render_template('level_view.html', level=level) # user_progress and levels_data will be injected by context_processor

# --- Context Processors ---
@app.context_processor
def inject_global_data():
    # This makes user_progress and levels_data available in all templates
    return dict(
        user_progress=user_progress,
        levels_data=levels_data
    )

# --- Code Execution (Simplified and needs more robust sandboxing for production) ---
import subprocess
import tempfile
import os

def execute_python_code(code_string, timeout_seconds=5):
    """
    Executes a string of Python code in a restricted manner.
    Returns a dictionary with 'output', 'error', and 'success' keys.
    WARNING: This is a simplified execution model. For production, use proper sandboxing.
    """
    with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.py', encoding='utf-8') as tmp_code_file:
        tmp_code_file.write(code_string)
        filepath = tmp_code_file.name

    try:
        # Execute the script using subprocess
        process = subprocess.run(
            ['python', filepath],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False # Don't raise exception for non-zero exit codes
        )

        stdout = process.stdout
        stderr = process.stderr

        if process.returncode == 0 and not stderr: # Crude success check
            return {"output": stdout, "error": None, "success": True, "raw_stderr": stderr}
        else:
            # Combine stdout and stderr for error reporting if stderr is present
            error_message = stderr if stderr else stdout
            return {"output": stdout, "error": error_message if error_message else "Execution failed with no specific error message.", "success": False, "raw_stderr": stderr}

    except subprocess.TimeoutExpired:
        return {"output": None, "error": f"Execution timed out after {timeout_seconds} seconds.", "success": False, "raw_stderr": ""}
    except Exception as e:
        return {"output": None, "error": f"An unexpected error occurred during execution: {str(e)}", "success": False, "raw_stderr": ""}
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


# --- API Routes ---
@app.route('/api/levels', methods=['GET'])
def get_all_levels_api():
    # API returns simplified list for potential JS use, or full data if needed
    return jsonify([{"id": level["id"], "title": level["title"], "completed": level["completed"], "unlocked": level["unlocked"]} for level in levels_data])

@app.route('/api/level/<int:level_id>', methods=['GET'])
def get_level_api(level_id):
    level = next((l for l in levels_data if l["id"] == level_id), None)
    if level:
        # Unlock check is now done at page render, but API can also enforce it
        # if not level["unlocked"] and level_id != 1:
        #     return jsonify({"error": "Level locked"}), 403
        return jsonify(level)
    return jsonify({"error": "Level not found"}), 404

@app.route('/api/submit_code', methods=['POST'])
def submit_code_api():
    data = request.get_json()
    level_id = data.get('level_id')
    user_code = data.get('user_code')

    if level_id is None or user_code is None:
        return jsonify({"error": "Missing level_id or user_code"}), 400

    level = next((l for l in levels_data if l["id"] == int(level_id)), None)
    if not level:
        return jsonify({"error": "Level not found"}), 404

    execution_result = execute_python_code(user_code)

    is_correct = False
    feedback_message = ""

    if execution_result["success"]:
        # Normalize outputs for comparison (e.g., strip trailing newlines)
        actual_output_normalized = execution_result["output"].strip()
        expected_output_normalized = level["expected_output"].strip()

        if actual_output_normalized == expected_output_normalized:
            is_correct = True
            feedback_message = "Correct! Well done."
            # Update user progress (will be expanded in gamification step)
            if level_id not in user_progress["completed_levels"]:
                user_progress["completed_levels"].append(level_id)
                level["completed"] = True # Mark level as completed in levels_data
                # Unlock next level if exists
                next_level_id = level_id + 1
                next_level = next((l for l in levels_data if l["id"] == next_level_id), None)
                if next_level:
                    next_level["unlocked"] = True
            user_progress["streak"] += 1 # Basic streak
        else:
            feedback_message = "Incorrect. \nYour output:\n```\n{}\n```\n\nExpected output:\n```\n{}\n```".format(
                execution_result["output"] if execution_result["output"] else "<no output>",
                level["expected_output"]
            )
            user_progress["streak"] = 0 # Reset streak
    else:
        feedback_message = "Execution Error:\n```\n{}\n```".format(execution_result["error"])
        if execution_result["output"]: # Include stdout if any, even on error
            feedback_message += "\n\nYour output before error:\n```\n{}\n```".format(execution_result["output"])
        user_progress["streak"] = 0 # Reset streak

    return jsonify({
        "correct": is_correct,
        "message": feedback_message,
        "output": execution_result["output"],
        "error": execution_result["error"],
        "expected_output": level["expected_output"], # Send expected output for display
        "user_progress": { # Send updated progress for UI updates
            "streak": user_progress["streak"],
            "completed_levels": user_progress["completed_levels"]
        }
    })

if __name__ == '__main__':
    app.run(debug=True)
