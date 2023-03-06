'use strict';

let blueeqn = false;
let greeneqn = false;
let redeqn = false;
let bluehyp = false;
let greenhyp = false;
let redhyp = false;
let bluesol = false;
let greensol = false;
let redsol = false;
// console.log('blueeqn:' + blueeqn);

function checkEqnComplete(be, ge, re) {
  let testequation = '';
  let passedTest = false;
  if (be & ge & re) {
    console.log('Equation!');
    // replace loading with static
    testequation = document.querySelector('#testequation').value;
    passedTest = processEquation(testequation);
    if (passedTest) {
      document.querySelector('#blueeqn').classList.add('is-static');
      document.querySelector('#greeneqn').classList.add('is-static');
      document.querySelector('#redeqn').classList.add('is-static');
      // activate hypothesis
      document.querySelector('#bluehyp').classList.remove('is-static');
      document.querySelector('#greenhyp').classList.remove('is-static');
      document.querySelector('#redhyp').classList.remove('is-static');
    }

    document.querySelector('#testequation').value = '';
    document.querySelector('#blueeqn').classList.remove('is-loading');
    document.querySelector('#greeneqn').classList.remove('is-loading');
    document.querySelector('#redeqn').classList.remove('is-loading');
    // reset eqn flags
    blueeqn = false;
    greeneqn = false;
    redeqn = false;
  }
}

function checkHypComplete(be, ge, re) {
  let testhypothesis = '';
  let passedTest = false;

  if (be & ge & re) {
    console.log('Hypothesis!');
    testhypothesis = document.querySelector('#testhypothesis').value;
    passedTest = processHypothesis(testhypothesis);

    if (passedTest) {
      document.querySelector('#bluesol').classList.remove('is-static');
      document.querySelector('#greensol').classList.remove('is-static');
      document.querySelector('#redsol').classList.remove('is-static');

      document.querySelector('#bluehyp').classList.add('is-static');
      document.querySelector('#greenhyp').classList.add('is-static');
      document.querySelector('#redhyp').classList.add('is-static');
    }

    document.querySelector('#testhypothesis').value = '';
    document.querySelector('#bluehyp').classList.remove('is-loading');
    document.querySelector('#greenhyp').classList.remove('is-loading');
    document.querySelector('#redhyp').classList.remove('is-loading');

    bluehyp = false;
    greenhyp = false;
    redhyp = false;
    // activate solve
  }
}

function checkSolComplete(be, ge, re) {
  let testResult = '';

  if (be & ge & re) {
    console.log('Solution!');
    testResult = checkSolution();
    if (testResult === 'incorrect') {
      if (trial_num > 10) {
        alert(
          'Wah-wuh. You have reached the maximum number of trials without a correct attempt. Better luck next time'
        );
        return;
      } else {
        alert('That is not the correct solution. Try again.');
        document.querySelector('#bluesol').classList.add('is-static');
        document.querySelector('#greensol').classList.add('is-static');
        document.querySelector('#redsol').classList.add('is-static');
        // activate solve
        document.querySelector('#blueeqn').classList.remove('is-static');
        document.querySelector('#greeneqn').classList.remove('is-static');
        document.querySelector('#redeqn').classList.remove('is-static');
      }
    } else if (testResult === 'improper') {
      alert('Some of the solutions are improperly entered.');

      bluesol = false;
      greensol = false;
      redsol = false;
      document.querySelector('#bluesol').classList.remove('is-loading');
      document.querySelector('#greensol').classList.remove('is-loading');
      document.querySelector('#redsol').classList.remove('is-loading');
    } else if (testResult === 'correct') {
      let turn_string = '';

      if (trial_num == 1) {
        turn_string = ' turn!';
      } else {
        turn_string = ' turns!';
      }

      alert(
        'Nice work. You solved the challenge in ' + trial_num + turn_string
      );
    }
  }
}

document.querySelector('#blueeqn').addEventListener('click', function () {
  if (!blueeqn) {
    document.querySelector('#blueeqn').classList.add('is-loading');
    blueeqn = true;
    checkEqnComplete(blueeqn, greeneqn, redeqn);
    // console.log('blueeqn:' + blueeqn);
    //   } else {
    //     document.querySelector('#blueeqn').classList.remove('is-loading');
    //     blueeqn = false;
  }
});

document.querySelector('#greeneqn').addEventListener('click', function () {
  if (!greeneqn) {
    document.querySelector('#greeneqn').classList.add('is-loading');
    greeneqn = true;
    checkEqnComplete(blueeqn, greeneqn, redeqn);
    // console.log('blueeqn:' + blueeqn);
  }
});

document.querySelector('#redeqn').addEventListener('click', function () {
  if (!redeqn) {
    document.querySelector('#redeqn').classList.add('is-loading');
    redeqn = true;
    checkEqnComplete(blueeqn, greeneqn, redeqn);
    // console.log('blueeqn:' + blueeqn);
  }
});

document.querySelector('#bluehyp').addEventListener('click', function () {
  if (!blueeqn) {
    document.querySelector('#bluehyp').classList.add('is-loading');
    bluehyp = true;
    checkHypComplete(bluehyp, greenhyp, redhyp);
    // console.log('blueeqn:' + blueeqn);
    //   } else {
    //     document.querySelector('#blueeqn').classList.remove('is-loading');
    //     blueeqn = false;
  }
});

document.querySelector('#greenhyp').addEventListener('click', function () {
  if (!greeneqn) {
    document.querySelector('#greenhyp').classList.add('is-loading');
    greenhyp = true;
    checkHypComplete(bluehyp, greenhyp, redhyp);
    // console.log('blueeqn:' + blueeqn);
  }
});

document.querySelector('#redhyp').addEventListener('click', function () {
  if (!redeqn) {
    document.querySelector('#redhyp').classList.add('is-loading');
    redhyp = true;
    checkHypComplete(bluehyp, greenhyp, redhyp);
    // console.log('blueeqn:' + blueeqn);
  }
});

document.querySelector('#bluesol').addEventListener('click', function () {
  if (!blueeqn) {
    document.querySelector('#bluesol').classList.add('is-loading');
    bluesol = true;
    checkSolComplete(bluesol, greensol, redsol);
    // console.log('blueeqn:' + blueeqn);
    //   } else {
    //     document.querySelector('#blueeqn').classList.remove('is-loading');
    //     blueeqn = false;
  }
});

document.querySelector('#greensol').addEventListener('click', function () {
  if (!greeneqn) {
    document.querySelector('#greensol').classList.add('is-loading');
    greensol = true;
    checkSolComplete(bluesol, greensol, redsol);
    // console.log('blueeqn:' + blueeqn);
  }
});

document.querySelector('#redsol').addEventListener('click', function () {
  if (!redeqn) {
    document.querySelector('#redsol').classList.add('is-loading');
    redsol = true;
    checkSolComplete(bluesol, greensol, redsol);
    // console.log('blueeqn:' + blueeqn);
  }
});

// //CODE FOR CLOCK
// function startTime() {
//   var today = new Date();
//   var h = today.getHours();
//   var m = today.getMinutes();
//   m = checkTime(m);
//   if (h > 12) {
//     h = h - 12;
//   }
//   document.getElementById('timer').innerHTML = h + ':' + m;
//   var t = setTimeout(startTime, 500);
// }
// function checkTime(i) {
//   if (i < 10) {
//     i = '0' + i;
//   }
//   return i;
// }

const endtime = new Date(Date.now() + 10 * 60 * 1000);

// Update the count down every 1 second
var x = setInterval(function () {
  // Get today's date and time
  var now = new Date().getTime();
  // Find the distance between now and the count down date
  var distance = endtime - now;

  // Time calculations for days, hours, minutes and seconds
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Output the result in an element with id="demo"
  document.getElementById('timer').innerHTML =
    minutes + ':' + String(seconds).padStart(2, '0');

  // If the count down is over, write some text
  if (distance < 0) {
    clearInterval(x);
    document.getElementById('timer').innerHTML = "TIME'S UP!";
  }
}, 1000);
