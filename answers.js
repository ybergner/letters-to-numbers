let combination = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
let keys = {};
let trial_num = 1;
let express = 0;

// Takes in submitted seed or blank and generates a unique combination

// Creates the Encryption/Decryption system for the excercise
function randomize() {
  // Shuffles letters in the array using a seed to create the encryption formula
  //   Math.seedrandom(seed + '');
  for (let i = 0; i < 10; i++) {
    let place = Math.floor(Math.random() * 9);
    let temp = combination[place];
    combination[place] = combination[i];
    combination[i] = temp;
  }

  // Makes a dictionaray that holds the decryption formula
  for (let i = 0; i < 10; i++) {
    let char = combination[i];
    keys[char] = i;
  }

  //   console.log(keys);
}

randomize();

//Decrypts equation to solve and then encrypts the answer and puts in the chart
function processEquation(textbar_content) {
  let position = 0;
  let answer = '';
  let terms = new Array();
  let expressions = new Array();

  //   strip whitespace
  textbar_content = textbar_content.split(' ').join('');

  //Breaks up the textarea string into individual characters and expressions
  // Example input : A+BB+C
  // Example output: ["A", "BB", "c"] , ["+", "+"]
  for (let i = 0; i < textbar_content.length; i++) {
    let char = textbar_content.charAt(i).toUpperCase();

    //Checking for valid input
    if ((i == 0 && (char == '+' || char == '-')) || express >= 2) {
      alert(
        'There is a problem with the syntax of the equation. Please try again'
      );

      //   $('#l2n_step1_text').val('');
      express = 0;
      return false;
    }

    switch (char) {
      case '+':
        expressions.push('+');
        position++;
        express++;
        break;
      case '-':
        expressions.push('-');
        position++;
        express++;
        break;
      default:
        if (terms[position] === null || terms[position] == undefined) {
          terms[position] = char;
          express = 0;
        } else {
          terms[position] += char;
          express = 0;
        }
    }
  }

  //Error checking for correct amount of expressions
  if (
    expressions.length == 0 ||
    expressions.length != terms.length - 1 ||
    terms.length == 0
  ) {
    alert(
      'There is a problem with the syntax of the equation. Please try again'
    );
    // $('#l2n_step1_text').val('');
    return false;
  }

  //Takes the 2 strings, translates them and then does the appropiate operation
  //Retranslates and the cycle repeats till the array is finished
  for (let i = 0; i < terms.length - 1; i++) {
    let result = '';
    let first_num = translate(terms[i]);
    let second_num = translate(terms[i + 1]);
    let operation = expressions[i];

    switch (operation) {
      case '+':
        result += first_num + second_num;
        break;
      case '-':
        result += first_num - second_num;
        break;
      default:
        break;
    }

    terms[i + 1] = retranslate(result);
    console.log(retranslate(result));
  }

  let index = terms.length - 1;
  answer = terms[index];

  document.querySelector('td#equation_' + trial_num).textContent =
    textbar_content + ' = ' + answer;

  //   $('td#equation_' + trial_num).append(textbar_content + ' = ' + answer);
  //   has_guessed = false;
  return true;
}

// Encrypts the number into a string
function retranslate(result) {
  let answer = '';
  for (let i = 0; i < result.length; i++) {
    let char = result.charAt(i);
    if (char == '-' || char === '.') {
      answer += char;
      continue;
    } else {
      let num = parseInt(char);
      answer += combination[num];
    }
  }
  return answer;
}

// Decrypts the string into a number
function translate(term) {
  let num = '';

  for (let i = 0; i < term.length; i++) {
    let char = term.charAt(i);
    num += keys[char];
  }

  return parseInt(num);
}

// hypothesis

//Function to check guesses
function processHypothesis(hypothesis) {
  //Takes entered value and clears textbar
  hypothesis = hypothesis.split(' ').join('');
  let letter = hypothesis[0].toUpperCase();
  let number = Number(hypothesis[2]);

  console.log(combination.includes(letter));
  //   syntax validation
  if (
    hypothesis.length != 3 ||
    hypothesis[1] != '=' ||
    typeof number != 'number' ||
    combination.includes(letter) == false
  ) {
    alert(
      'There is a problem with the syntax of the hypothesis. It must be a single formula of the form [Letter] = [Number]. Please try again'
    );
    return false;
  }

  document.querySelector('td#hypothesis_' + trial_num).textContent = hypothesis;

  //Assumes format is Letter = Number , with one Letter and one Number

  if (keys[letter] == number) {
    document.querySelector('td#feedback_' + trial_num).textContent = 'TRUE';
  } else {
    document.querySelector('td#feedback_' + trial_num).textContent = 'FALSE';
  }

  // if (trial_num >= 10) {
  //     document.getElementById("l2n_equation_send").disabled = true;
  //     document.getElementById("l2n_guess_send").disabled = true;
  //     return;
  // }

  trial_num++;
  return true;
  // document.getElementById("l2n_equation_send").disabled = false;
  // document.getElementById("l2n_guess_send").disabled = true;
}

//Function that handles checking if the final answer is correct or not
function checkSolution() {
  let answers = new Array();
  // first check for syntax
  for (let i = 0; i < 9; i++) {
    answers[i] = document.querySelector('input' + '#sol_' + i).value;
    console.log(
      'answer[' + i + ']: ' + answers[i] + '; ' + parseInt(answers[i])
    );
    //Checks for answers that are not single digits
    if (answers[i].length != 1 || parseInt(answers[i]) == NaN) {
      return 'improper';
    }
  }

  console.log('passed syntax check of solution...');
  //Checks for if the answer is correct or not
  for (let i = 0; i < 9; i++) {
    let num = parseInt(answers[i]);
    switch (i) {
      case 0:
        if (combination[num] == 'A') {
          continue;
        } else {
          return 'incorrect';
        }
      case 1:
        if (combination[num] == 'B') {
          continue;
        } else {
          return 'incorrect';
        }
      case 2:
        if (combination[num] == 'C') {
          continue;
        } else {
          return 'incorrect';
        }
      case 3:
        if (combination[num] == 'D') {
          continue;
        } else {
          return 'incorrect';
        }
      case 4:
        if (combination[num] == 'E') {
          continue;
        } else {
          return 'incorrect';
        }
      case 5:
        if (combination[num] == 'F') {
          continue;
        } else {
          return 'incorrect';
        }
      case 6:
        if (combination[num] == 'G') {
          continue;
        } else {
          return 'incorrect';
        }
      case 7:
        if (combination[num] == 'H') {
          continue;
        } else {
          return 'incorrect';
        }
      case 8:
        if (combination[num] == 'I') {
          continue;
        } else {
          return 'incorrect';
        }
      case 9:
        if (combination[num] == 'J') {
          continue;
        } else {
          return 'incorrect';
        }
      default:
        break;
    }
  }
  return 'correct';
}

//Shows end screen
function correct() {
  let turn_string = '';

  if (trial_num == 1) {
    turn_string = 'turn!';
  } else {
    turn_string = 'turns!';
  }

  alert('Nice work. You solved the challenge in `trial_num + turn_string`.');
  //   $('div#l2nmodal').addClass('is-active');
  //   $('#submit_start').remove();

  //   //Do not remove either one of the replace statements
  //   //In the unlikely event a person guesses right on their first turn
  //   //The first replace statement will be needed.

  //   $('#l2nmodal_instructions_content').replaceWith(
  //     `<div class="modal-content" style="background-color:white;" id="l2n_final_modal">
  //             <p id="title">
  //                 CONGRATS!
  //             </p>
  //             <p id ="subtitle">
  //                 Nice job, team!
  //             <br>
  //                 You solved the puzzle in ` +
  //       trial_num +
  //       `  ` +
  //       turn_string +
  //       `
  //             </p>
  //             </div>
  //         </div>`
  //   );

  //   $('#l2n_try_again_modal').replaceWith(
  //     `
  //             <div class="modal-content" style="background-color:white;" id="l2n_final_modal">
  //             <p id="title">
  //                  CONGRATS!
  //             </p>
  //             <p id ="subtitle">
  //                 Nice job, team!
  //             <br>
  //                 You solved the puzzle in ` +
  //       trial_num +
  //       `  ` +
  //       turn_string +
  //       `
  //             </p>
  //             </div>
  //             </div>`
  //   );

  //   $('#l2n_return').remove();
}

//Shows "Try Again" screen if incorrect
function incorrect() {
  alert('That is not the correct solution. Try again.');
  // $("div#l2nmodal").addClass("is-active");
  // $("#submit_start").remove();
  // $("#l2nmodal_instructions_content").replaceWith(`
  //     <div class="modal-content" style="background-color:white;" id="l2n_try_again_modal">
  //         <p id="title">
  //             NOT QUITE,
  //         <br>
  //             TRY AGAIN!
  //         </p>
  //     </div>
  //         <button class="button" id="l2n_return"><span id="button_text">Return</span></button>
  //     </div>` );
}
