// Import the required functions from the Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';
import { questions } from './questions.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvi_vIWg2RteioUxi92xJ1VQ21-rL9fKc",
  authDomain: "divergence-series.firebaseapp.com",
  databaseURL: "https://divergence-series-default-rtdb.firebaseio.com",
  projectId: "divergence-series",
  storageBucket: "divergence-series.appspot.com",
  messagingSenderId: "1088469006690",
  appId: "1:1088469006690:web:f6ec980f6b6464f6de943b"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Global variables
let currentQuestionIndex = 0;
let organizedData = [];
let score = 0;
let userInfo = {};
let attributeScores = {};

let progressBarInitialized = false;

// Setup quiz function
function setupQuiz() {
  initProgressBar();
  if (!progressBarInitialized) {
    initProgressBar();
    progressBarInitialized = true;
  }
  $('#submitUserInfo').on('click', function () {
    userInfo.username = $('#username').val();
    userInfo.region = $('#region').val();
    userInfo.industry = $('#industry').val();
    userInfo.age = $('#age').val();
    userInfo.gender = $('#gender').val();

    organizedData = convertData(questions);
    organizedData = shuffle(organizedData);
    organizedData = selectQuestions(organizedData, 3);

    // Filter out questions with SL NO 25 and SL NO 26
    organizedData = organizedData.filter(item => item["SL NO"] !== "25" && item["SL NO"] !== "26");

    $('.user-info-container').hide();

    if (organizedData.length > 0) {
      displayQuestion(organizedData[currentQuestionIndex]);
    } else {
      console.error('No questions available.');
    }
  });

  $('#answers').on('click', '.answer-button', function () {
    const answerIndex = $(this).index();
    handleAnswerClick(answerIndex);
  });
}




let quizDataSubmitted = false; // Flag to track whether quiz data has been submitted

// Save the user's quiz data to Firebase
async function saveQuizData(userInfo, attributeScores) {
  try {
    // Check if data has already been submitted
    if (quizDataSubmitted) {
      alert('Quiz data has already been submitted!');
      return;
    }

    // Set the flag to true to prevent multiple submissions
    quizDataSubmitted = true;

    // Create a new document in the "quizData" collection
    const docRef = await addDoc(collection(db, 'quizData'), {
      username: userInfo.username,
      region: userInfo.region,
      industry: userInfo.industry,
      age: userInfo.age,
      gender: userInfo.gender,
      attributeScores: attributeScores
    });

    console.log('Quiz data saved with ID: ', docRef.id);
    alert('Quiz data submitted successfully!');
  } catch (error) {
    console.error('Error saving quiz data: ', error);
  }
}

// Function to shuffle an array
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

// Function to select a specific number of questions for each attribute
function selectQuestions(data, questionsPerAttribute) {
  const selectedQuestions = {};

  data.forEach(item => {
    const slNo = item["SL NO"];

    // Exclude questions with SL NO 25 and SL NO 26
    if (slNo === "25" || slNo === "26") {
      return;
    }

    const attributeName = item.ATTRIBUTE;

    if (!selectedQuestions[attributeName]) {
      selectedQuestions[attributeName] = [];
    }

    if (selectedQuestions[attributeName].length < questionsPerAttribute) {
      selectedQuestions[attributeName].push(item);
    }
  });

  return Object.values(selectedQuestions).flat();
}



// Function to convert the questions data to the desired structure
// Function to convert the questions data to the desired structure
function convertData(data) {
  const convertedData = {};

  data.forEach(item => {
    const slNo = item["SL NO"];

    // Exclude questions with SL NO 25 and SL NO 26
    if (slNo === "25" || slNo === "26") {
      return;
    }

    if (!convertedData[slNo]) {
      convertedData[slNo] = [];
    }

    const existingQuestion = convertedData[slNo].find(
      q => q.QUESTIONS === item.QUESTIONS
    );

    if (!existingQuestion) {
      convertedData[slNo].push({
        "SCENARIO": item.SCENARIO,
        "QUESTIONS": item.QUESTIONS,
        "ANSWERS": [item.ANSWERS],
        "ATTRIBUTE": item.ATTRIBUTE,
        "SCORE": item.SCORE
      });
    } else {
      existingQuestion.ANSWERS.push(item.ANSWERS);
    }
  });

  const result = Object.values(convertedData).flat();

  return result;
}



// Function to handle the selected answer and navigate to the next question
// Function to handle the selected answer and navigate to the next question
function handleAnswerClick(answerIndex) {
  const currentQuestion = organizedData[currentQuestionIndex];

  try {
    if (!currentQuestion) {
      throw new Error('Current question is undefined. Index: ' + currentQuestionIndex);
    }

    let answersArray;

    // Check if ANSWERS is a string and not an array
    if (typeof currentQuestion.ANSWERS === 'string') {
      // Split the ANSWERS string into an array of lines (assuming each line is an answer)
      answersArray = currentQuestion.ANSWERS.split('\n').map(answer => answer.trim());
    } else if (Array.isArray(currentQuestion.ANSWERS)) {
      // If ANSWERS is already an array, use it directly
      answersArray = currentQuestion.ANSWERS.map(answer => answer.trim());
    } else {
      throw new Error('Invalid format for ANSWERS property.');
    }

    if (!Array.isArray(answersArray) || answersArray.length === 0) {
      throw new Error('Invalid format for ANSWERS property.');
    }

    // Get the selected answer based on the provided index
    const selectedAnswer = answersArray[answerIndex];

    // Find the selected answer in the original questions array
    const selectedQuestion = questions.find(q =>
      q.QUESTIONS === currentQuestion.QUESTIONS &&
      ((typeof q.ANSWERS === 'string' && q.ANSWERS.includes(selectedAnswer)) ||
      (Array.isArray(q.ANSWERS) && q.ANSWERS.includes(selectedAnswer)))
    );

    if (!selectedQuestion) {
      throw new Error('Selected question not found in the original questions array. Selected Answer: ' + selectedAnswer);
    }

    // Update the total score with the score from the selected answer
    score += parseInt(selectedQuestion.SCORE, 10);

    // Display the updated score (modify this based on your HTML structure)
    console.log('Score: ' + score);

    // Check if it's the last question
    if (currentQuestionIndex < organizedData.length - 1) {
      // Move to the next question
      currentQuestionIndex++;
      displayQuestion(organizedData[currentQuestionIndex]);
    } else {
      // End of quiz logic (e.g., show results)
      displayEndOfQuiz();
    }
  } catch (error) {
    console.error(error.message);
  }
}




function resetQuiz() {
  // Reset variables
  currentQuestionIndex = 0;
  score = 0;
  userInfo = {};
  quizDataSubmitted = false;

  // Clear the displayed content
  $('#question').empty();
  $('#answers').empty();
  $('.attribute-container, .save-container, #resetButton, .read-more-container, .register-container').remove(); // Remove additional containers

  // Update the progress bar width to 0%
  $('.progress-bar').css('width', '0%');

  // Show user information input fields and dropdowns after resetting
  $('.user-info-container').show();

  // Clear previous data
  clearPreviousData();

  // Restart the quiz
  setupQuiz();
}













function displayProgressBar(currentIndex, totalQuestions) {
  const progressPercentage = (currentIndex / totalQuestions) * 100;

  const $progressBarContainer = $('.progress-bar-container');
  const $progressBar = $progressBarContainer.find('.progress-bar');

  $progressBar.css('width', progressPercentage + '%');
}

// Function to initialize progress bar
function initProgressBar() {
  const $progressBarContainer = $('<div>').addClass('progress-bar-container');
  const $progressBar = $('<div>').addClass('progress-bar');

  $progressBarContainer.append($progressBar);

  // Check if the progress bar container already exists
  if ($('.progress-bar-container').length === 0) {
    $('.container').append($progressBarContainer);
  }
}


// Function to update progress bar based on current question index
function updateProgressBar(currentIndex, totalQuestions) {
  const progressPercentage = (currentIndex / totalQuestions) * 100;

  const $progressBarContainer = $('.progress-bar-container');
  const $progressBar = $progressBarContainer.find('.progress-bar');

  $progressBar.css('width', progressPercentage + '%');
}

// Function to remove progress bar
function removeProgressBar() {
  $('.progress-bar-container').remove();
}

// Display question and progress bar
function displayQuestion(question) {
  if (question) {
    $('#question').text(question.QUESTIONS);

    const $answersList = $('#answers');
    $answersList.empty();

    if (Array.isArray(question.ANSWERS)) {
      question.ANSWERS.forEach((answer, index) => {
        const $answerItem = $('<li>')
          .addClass('answer-button')
          .text(answer)
          .css('background-color', getARandomColor());
        $answersList.append($answerItem);
      });
    } else {
      const $answerItem = $('<li>')
        .addClass('answer-button')
        .text(question.ANSWERS)
        .css('background-color', getARandomColor());
      $answersList.append($answerItem);
    }

    // Display progress bar on the first question
    if (currentQuestionIndex === 0) {
      initProgressBar();
    }

    // Update progress bar
    updateProgressBar(currentQuestionIndex + 1, organizedData.length);
  } else {
    console.error('No question found');
  }
}


// Function to generate a random color
function getARandomColor() {
  const colors = ['#008080', '#C0C0C0', '#40E0D0', '#FFA500'];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}



function displayEndOfQuiz() {
  // Clear the question and answers
  $('#question').empty();
  $('#answers').empty();

  // Calculate the total score for each attribute
  const attributeScores = {};
  organizedData.forEach(question => {
    const attributeName = question.ATTRIBUTE;

    if (!attributeScores[attributeName]) {
      attributeScores[attributeName] = 0;
    }

    // Convert the score to a string and split into individual digits
    const scoreDigits = question.SCORE.toString().split('').map(Number);

    // Add each digit to the total score for the attribute
    scoreDigits.forEach(digit => {
      attributeScores[attributeName] += digit;
    });
  });

  // Display the total score and bar chart for each attribute
  const $attributeContainer = $('<div>').addClass('attribute-container');
  Object.keys(attributeScores).forEach(attributeName => {
    const totalScore = attributeScores[attributeName];
    const $attributeItem = $('<div>').addClass('attribute-item');

    // Append the attribute name to the attribute item
    $attributeItem.append($('<p>').text(attributeName));

    // Create bar chart
    const $barChart = $('<div>').addClass('bar-chart');
    const $bar = $('<div>').addClass('bar').css({
      width: totalScore * 20 + 'px', // Adjust the multiplier for the width
      backgroundColor: getRandomColor()
    });
    $bar.text(totalScore); // Keep the score text in the bar chart
    $barChart.append($bar);

    // Append the bar chart to the attribute item
    $attributeItem.append($barChart);

    // Append the attribute item to the container
    $attributeContainer.append($attributeItem);
  });

  // Display "Save" button only at the last screen
  const $saveContainer = $('<div>').addClass('save-container');
  const $saveButton = $('<button>').attr('id', 'saveButton').text('Save');
  $saveButton.on('click', function () {
    // Save the quiz data to Firebase
    saveQuizData(userInfo, attributeScores);
  });
  $saveContainer.append($saveButton);

  // Display reset button only at the last screen
  const $resetButton = $('<button>').attr('id', 'resetButton').text('Reset Quiz');
  $resetButton.on('click', resetQuiz);

  // Display "Read More" button
  const $readMoreButton = $('<a>').attr('href', 'https://www.fundamentaldecisions.com/2024/02/02/oppurtunity-alchemy-read-me/').attr('target', '_blank').text('Read More');
  const $readMoreContainer = $('<div>').addClass('read-more-container').append($readMoreButton);

  // Display "Register for the Program" button
  const $registerButton = $('<a>').attr('href', 'https://docs.google.com/forms/d/e/1FAIpQLSeagxcvPwBu731hwojdkQGeq9Px3W7ZvykEmrZBb2wrz8j7cg/viewform').attr('target', '_blank').text('Register for the Program');
  const $registerContainer = $('<div>').addClass('register-container').append($registerButton);

  // Remove previous containers and progress bar
  $('.attribute-container, .save-container, #resetButton, .read-more-container, .register-container, .progress-bar-container').remove();

  // Append everything to the main container
  $('.container').append($attributeContainer, $resetButton, $readMoreContainer, $registerContainer, $saveContainer);
}



// Function to generate a random color
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}



// Clear previous data function
function clearPreviousData() {
  organizedData = [];

  // Reset the progress bar to 0% and remove any existing progress bar container
  const $existingProgressBarContainer = $('.progress-bar-container');
  if ($existingProgressBarContainer.length > 0) {
    $existingProgressBarContainer.remove();
  }

  // Initialize a new progress bar
  initProgressBar();

  // Ensure the Reset button is not displayed at the start
  $('#resetButton').remove();
}


// Document ready function
$(document).ready(() => {
  // Call the new setupQuiz function to start the quiz
  setupQuiz();
});

