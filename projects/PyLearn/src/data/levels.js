export const levels = [
  {
    id: 1,
    title: "Level 1: Hello, PyLearn!",
    task: "Your first task is simple: print the classic greeting \"Hello, PyLearn!\" to the console.",
    initialCode: "print(\"Hello, PyLearn!\")",
    expectedOutput: "Hello, PyLearn!\n",
    hints: [
      "Remember the basic Python function for displaying text.",
      "The function you're looking for is `print()`.",
      "Make sure your text is inside quotes: `print(\"Your text here\")`.",
    ],
  },
  {
    id: 2,
    title: "Level 2: Variables Ahoy!",
    task: "Create a variable named `name` and assign your name (or any name) to it as a string. Then, print a greeting using this variable, like `Hello, [Your Name]!`.",
    initialCode: "name = \"PyLearner\"\nprint(f\"Hello, {name}!\")",
    expectedOutput: "Hello, PyLearner!\n", // This will need to be dynamically validated later
    hints: [
      "Variables store data. You assign a value using the `=` operator.",
      "Strings are enclosed in single or double quotes.",
      "Use an f-string for easy variable interpolation: `print(f\"Hello, {variable}!\")`.",
    ],
  },
  {
    id: 3,
    title: "Level 3: Basic Arithmetic",
    task: "Perform a simple addition. Print the sum of 5 and 3.",
    initialCode: "",
    expectedOutput: "8\n",
    hints: [
      "You can use the `+` operator for addition.",
      "`print()` can directly output the result of an arithmetic operation.",
    ],
  },
  {
    id: 4,
    title: "Level 4: User Input",
    task: "Ask the user for their favorite color using `input()` and then print a message confirming their choice, like: `Your favorite color is [color].`",
    initialCode: "",
    expectedOutput: "Your favorite color is blue.\n", // Dynamic input will make this tricky client-side
    hints: [
      "The `input()` function reads a line from input, converts it to a string, and returns that.",
      "Remember to store the input in a variable.",
      "Combine strings using `+` or f-strings for the final output.",
    ],
  },
  {
    id: 5,
    title: "Level 5: If-Else Statements",
    task: "Write a program that checks if a number is positive. If the variable `num` (set to 10) is greater than 0, print \"Positive\". Otherwise, print \"Not positive\".",
    initialCode: "num = 10\n",
    expectedOutput: "Positive\n",
    hints: [
      "Use `if` and `else` keywords.",
      "Conditions are followed by a colon `:` and indented blocks.",
      "Comparison operators like `>` are used to check conditions.",
    ],
  },
  {
    id: 6,
    title: "Level 6: For Loops",
    task: "Use a `for` loop to print numbers from 0 to 4 (inclusive).",
    initialCode: "",
    expectedOutput: "0\n1\n2\n3\n4\n",
    hints: [
      "The `range()` function is useful for generating sequences of numbers.",
      "A `for` loop iterates over items of a sequence.",
      "Remember the `for item in sequence:` syntax.",
    ],
  },
  {
    id: 7,
    title: "Level 7: While Loops",
    task: "Use a `while` loop to print numbers from 1 to 3 (inclusive).",
    initialCode: "",
    expectedOutput: "1\n2\n3\n",
    hints: [
      "A `while` loop continues as long as its condition is true.",
      "Don't forget to increment your loop variable inside the loop to avoid an infinite loop.",
    ],
  },
  {
    id: 8,
    title: "Level 8: Lists",
    task: "Create a list called `fruits` with three items: \"apple\", \"banana\", and \"cherry\". Then, print the entire list.",
    initialCode: "",
    expectedOutput: "['apple', 'banana', 'cherry']\n",
    hints: [
      "Lists are defined using square brackets `[]`.",
      "Items in a list are separated by commas.",
    ],
  },
  {
    id: 9,
    title: "Level 9: List Access",
    task: "Given the list `colors = [\"red\", \"green\", \"blue\"]`, print the second item in the list.",
    initialCode: "colors = [\"red\", \"green\", \"blue\"]\n",
    expectedOutput: "green\n",
    hints: [
      "List items are accessed by their index, starting from 0.",
      "The syntax for accessing an item is `list_name[index]`.",
    ],
  },
  {
    id: 10,
    title: "Level 10: Dictionaries",
    task: "Create a dictionary called `person` with keys \"name\" (value: \"Alice\") and \"age\" (value: 30). Then, print the dictionary.",
    initialCode: "",
    expectedOutput: "{'name': 'Alice', 'age': 30}\n",
    hints: [
      "Dictionaries are defined using curly braces `{}`.",
      "They store key-value pairs, separated by colons `:`.",
    ],
  },
  {
    id: 11,
    title: "Level 11: Dictionary Access",
    task: "Given the dictionary `car = {\"brand\": \"Ford\", \"model\": \"Mustang\"}`, print the value associated with the key \"model\".",
    initialCode: "car = {\"brand\": \"Ford\", \"model\": \"Mustang\"}\n",
    expectedOutput: "Mustang\n",
    hints: [
      "Dictionary values are accessed using their keys in square brackets: `dictionary_name[key]`.",
    ],
  },
  {
    id: 12,
    title: "Level 12: Functions",
    task: "Define a function called `greet` that takes one argument, `name`, and prints `Hello, [name]!` Call this function with your name.",
    initialCode: "",
    expectedOutput: "Hello, PyLearner!\n", // Needs dynamic validation
    hints: [
      "Define a function using the `def` keyword.",
      "Functions can take arguments in parentheses.",
      "Call a function by its name followed by parentheses containing arguments.",
    ],
  },
  {
    id: 13,
    title: "Level 13: Function Return Values",
    task: "Define a function `add_numbers` that takes two arguments, `a` and `b`, and returns their sum. Print the result of calling `add_numbers` with 7 and 3.",
    initialCode: "",
    expectedOutput: "10\n",
    hints: [
      "Use the `return` keyword to send a value back from a function.",
      "The returned value can be stored in a variable or directly printed.",
    ],
  },
  {
    id: 14,
    title: "Level 14: Comments",
    task: "Add a single-line comment that says \"This is my first Python program\" to your code. Then, print \"Comments are fun!\".",
    initialCode: "",
    expectedOutput: "Comments are fun!\n",
    hints: [
      "Single-line comments start with a `#` symbol.",
      "Comments are ignored by the Python interpreter.",
    ],
  },
  {
    id: 15,
    title: "Level 15: Modules (Conceptual)",
    task: "This level is conceptual. In a real Python environment, you'd `import` modules to use their functions. For example, to use math functions, you'd `import math`. Print a message: \"Modules expand possibilities!\"",
    initialCode: "",
    expectedOutput: "Modules expand possibilities!\n",
    hints: [
      "The `import` statement brings in external code.",
      "Think about how you'd use `math.sqrt()` after `import math`.",
    ],
  },
];