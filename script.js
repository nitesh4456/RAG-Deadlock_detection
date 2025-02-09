document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('.header');
    
    // This event listener checks if the user has scrolled more than 10px
    // If yes, it adds the 'scrolled' class to the header (for styling changes like shrinking)
    // If not, it removes the 'scrolled' class
    window.addEventListener('scroll', function () {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
});

// Object to store references to different topic sections by their IDs
let topicElements = {
    'aim': document.getElementById('aim'),
    'theory': document.getElementById('theory'),
    'procedure': document.getElementById('procedure'),
    'practice': document.getElementById('practice'),
    'code': document.getElementById('code'),
    'result': document.getElementById('result'),
    'quiz': document.getElementById('quiz'),
    'references': document.getElementById('references'),
    'tnt': document.getElementById('tnt')
};

let currentTopic = 'aim';  // Track the currently displayed topic

function switchContent(topic) {
    if (topic === currentTopic) {
        return; // Prevent unnecessary updates if the same topic is clicked again
    }

    topicElements[currentTopic].style.display = 'none'; // Hide the previous topic
    topicElements[topic].style.display = 'block'; // Show the selected topic
    currentTopic = topic; // Update the current topic
}

function toggleCode(language) {
    // Show C++ code and hide Python code if 'cpp' is selected
    if (language === 'cpp') {
        document.getElementById('cppCode').style.display = 'block';
        document.getElementById('pyCode').style.display = 'none';
    }
    // Show Python code and hide C++ code if 'python' is selected
    else if (language === 'python') {
        document.getElementById('cppCode').style.display = 'none';
        document.getElementById('pyCode').style.display = 'block';
    }
}

function copyCode(elementId) {
    var codeBlock = document.getElementById(elementId);
    var code = codeBlock.querySelector('code').innerText;

    // Copies the selected code text to the clipboard
    navigator.clipboard.writeText(code).then(function () {
        var copyButton = codeBlock.querySelector('.copy-button');
        copyButton.textContent = 'Copied!'; // Temporarily change button text
        setTimeout(function () {
            copyButton.textContent = 'Copy'; // Reset text after 2 seconds
        }, 2000);
    }, function (err) {
        console.error('Could not copy text: ', err);
    });
}

// Quiz Logic

const questions = [
    {
        question: " Q1) Which of the following is/are valid searching algorithms?",
        choices: ["Linear Search", "Bubble Sort", "Binary Search", "Quick Sort"],
        correctAnswers: [0, 2] // Correct answers are indexes 0 and 2
    },
    {
        question: " Q2) What is/are the time complexity of linear search?",
        choices: ["O(log n)", "O(n)", "O(n^2)", "O(1)"],
        correctAnswers: [1] // Correct answer is index 1
    }
];

let currentQuestion = 0;
let score = 0;

const questionElement = document.getElementById("question");
const choicesElement = document.getElementById("choices");
const nextButton = document.getElementById("next-btn");

function loadQuestion() {
    const question = questions[currentQuestion];
    questionElement.textContent = question.question;
    choicesElement.innerHTML = ''; // Clear previous choices

    // Create checkboxes for each answer choice
    question.choices.forEach((choice, index) => {
        const choiceElement = document.createElement("div");
        choiceElement.className = "choice";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `choice-${index}`;
        checkbox.value = index;

        const label = document.createElement("label");
        label.textContent = `  ${choice}`;
        label.htmlFor = `choice-${index}`;

        choiceElement.appendChild(checkbox);
        choiceElement.appendChild(label);

        choicesElement.appendChild(choiceElement);
    });
}

function checkAnswer() {
    const question = questions[currentQuestion];
    const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    
    // Get selected choices as an array of indexes
    const selectedIndexes = Array.from(selectedCheckboxes).map(checkbox => parseInt(checkbox.value));

    // Compare selected answers with the correct ones (after sorting to ignore order)
    const isCorrect = JSON.stringify(selectedIndexes.sort()) === JSON.stringify(question.correctAnswers.sort());

    if (isCorrect) {
        score++; // Increase score if the answer is correct
    }

    currentQuestion++; // Move to the next question

    if (currentQuestion < questions.length) {
        loadQuestion(); // Load next question
    } else {
        showResult(); // Show final score when all questions are answered
    }
}

function showResult() {
    questionElement.textContent = `You scored ${score} out of ${questions.length}!`; // Display final score
    choicesElement.innerHTML = ''; // Clear options
    nextButton.style.display = "none"; // Hide "Next" button
}

// Add event listener to "Next" button to validate and move to the next question
nextButton.addEventListener("click", () => {
    checkAnswer();
});

loadQuestion(); // Load the first question initially
