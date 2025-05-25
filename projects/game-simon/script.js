$(document).ready(function(){

  // Checking for Web Audio API on your browser ...
  var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext // Safari and old versions of Chrome
    || false;

  if(!AudioContext) {

    // Sorry, but the game won't work for you
    alert('Sorry, but the Web Audio API is not supported by your browser.'
    + ' Please, consider downloading the latest version of '
    + 'Google Chrome or Mozilla Firefox');

  } else {

    // You can play the game !!!!
    var audioCtx = new AudioContext();
    audioCtx.suspend(); // Suspend context until a user gesture (like click)
    var frequencies = [329.63,261.63,220,164.81]; // E4, C4, A3, E3 (approx Green, Red, Yellow, Blue)

    var errOsc = audioCtx.createOscillator();
    errOsc.type = 'triangle';
    errOsc.frequency.value = 110; // A2, a low error tone
    errOsc.start(0.0); 
    var errNode = audioCtx.createGain();
    errOsc.connect(errNode);
    errNode.gain.value = 0;
    errNode.connect(audioCtx.destination);

    var ramp = 0.1; // Sound ramp time
    var vol = 0.5;  // Sound volume

    var gameStatus = {};

    gameStatus.reset = function(){
      this.init();
      this.strict = false; // Reset strict mode
      $('#mode-led').removeClass('led-on'); // Turn off strict LED
    }

    gameStatus.init = function(){
      // this.lastPush = $('#0'); // Not strictly needed if currPush is managed well
      this.sequence = [];
      this.tStepInd = 0; // Index for player's current step in sequence
      this.index = 0;    // Current length of sequence being played by machine / player is trying to match
      this.count = 0;    // Represents the current level or number of steps in sequence
      this.lock = true;  // Game locked (machine playing or player made error)
      this.timeStep = 1250; // Initial time step for sequence playback
    };

    // create Oscillators for the four button tones
    var oscillators = frequencies.map(function(frq){
      var osc = audioCtx.createOscillator();
      osc.type = 'sine'; // Sine wave is common for Simon tones
      osc.frequency.value = frq;
      osc.start(0.0); 
      return osc;
    });

    var gainNodes = oscillators.map(function(osc){
      var g = audioCtx.createGain();
      osc.connect(g);
      g.connect(audioCtx.destination);
      g.gain.value = 0; // Start silent
      return g;
    });


    function playGoodTone(num){ // num is 0, 1, 2, or 3
      // Ensure audioCtx is resumed (might be needed after inactivity or on first play)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      gainNodes[num].gain
        .linearRampToValueAtTime(vol, audioCtx.currentTime + ramp);
      gameStatus.currPush = $('#'+num); // jQuery selector for button with id="0", "1", "2", or "3"
      gameStatus.currPush.addClass('light'); // Add .light class (CSS handles the color)
    };

    function stopGoodTones(){
      if(gameStatus.currPush)
        gameStatus.currPush.removeClass('light');
      gainNodes.forEach(function(g){
        g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + ramp);
      });
      gameStatus.currPush = undefined;
      // gameStatus.currOsc = undefined; // currOsc was not defined/used
    };

    function playErrTone(){
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      errNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + ramp);
    };

    function stopErrTone(){
      errNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + ramp);
    };

    function gameStart(){
      // Try to resume AudioContext if it's suspended (e.g., after page load, before user interaction)
      if (audioCtx.state === 'suspended') {
          audioCtx.resume().then(() => {
              console.log("AudioContext resumed successfully for gameStart");
              proceedGameStart();
          }).catch(e => console.error("Error resuming AudioContext:", e));
      } else {
          proceedGameStart();
      }
    }
    
    function proceedGameStart() {
        console.log("Proceeding with game start logic");
        resetTimers();
        stopGoodTones(); // Ensure tones are off
        stopErrTone();   // Ensure error tone is off
        $('.count').text('--').removeClass('led-off'); // Update count display
        flashMessage('--',1); // Initial flash
        gameStatus.init();     // Initialize game variables
        addStep();             // Add first step to sequence and play
    }


    function setTimeStep(num){ // num is gameStatus.count (level)
      var tSteps = [1250 , 1000 , 750, 500 ]; // Time between sequence steps in ms
      if (num < 5) // Steps 1-4
        return tSteps[0];
      if (num < 9) // Steps 5-8
        return tSteps[1];
      if (num < 13) // Steps 9-12
        return tSteps[2];
      return tSteps[3]; // Steps 13+
    }

    function notifyError(pushObj){ // pushObj is the jQuery object of the button player pressed wrong
      gameStatus.lock = true; // Lock player input
      $('.push').removeClass('clickable').addClass('unclickable');
      playErrTone();
      if(pushObj)
        pushObj.addClass('light'); // Light up the wrong button briefly

      // Clear any pending player timeout for making a mistake
      clearTimeout(gameStatus.playerTimeoutHandle); 

      gameStatus.errorTimeoutHndl = setTimeout(function(){ // Timeout for error sound and light
        stopErrTone();
        if(pushObj)
          pushObj.removeClass('light');
        
        gameStatus.sequencePlayTimeoutHndl = setTimeout(function(){ // Timeout before restarting sequence or game
          if(gameStatus.strict) {
            gameStart(); // Restart game fully in strict mode
          } else {
            playSequence(); // Replay current sequence in normal mode
          }
        },1000);
      },1000);
      flashMessage('!!',2); // Flash "!!" on display
    };

    function notifyWin(){
      gameStatus.lock = true;
      $('.push').removeClass('clickable').addClass('unclickable');
      var cnt = 0;
      // Find the last button ID that was lit (or a default if none)
      var lastButtonId = gameStatus.sequence.length > 0 ? gameStatus.sequence[gameStatus.sequence.length - 1] : '0';
      
      gameStatus.winSequenceHndl = setInterval(function(){
        playGoodTone(lastButtonId); // Flash the last button or a default
        gameStatus.winToneTimeoutHndl = setTimeout(stopGoodTones,80);
        cnt++;
        if(cnt === 8){ // Flash 8 times
          clearInterval(gameStatus.winSequenceHndl);
          // Potentially reset or offer new game
           flashMessage('**', 2); // Flash "**"
           // Consider calling gameStart() or gameStatus.reset() after win celebration
           setTimeout(gameStart, 2000); // Example: restart after 2 secs
        }
      },160);
    }

    function flashMessage(msg,times){
      $('.count').text(msg);
      var flashFunc = function(){
        $('.count').addClass('led-off');
        gameStatus.flashOffTimeoutHndl = setTimeout(function(){
          $('.count').removeClass('led-off');
        },250);
      };
      var flashCount = 0;
      flashFunc(); // Initial flash
      gameStatus.flashIntervalHndl = setInterval(function(){
        flashFunc();
        flashCount++;
        if(flashCount >= times) { // Make sure it flashes 'times' total (initial + interval)
             clearInterval(gameStatus.flashIntervalHndl);
             // After flashing, restore count display if game is ongoing
             if (!gameStatus.lock && gameStatus.count > 0) { // Or some other condition
                 displayCount();
             } else if (msg === '--' && !$('.count').hasClass('led-off')) {
                 // Keep '--' if it's the initial game start message
             }
        }
      },500);
    };

    function displayCount(){
      var countToShow = gameStatus.count > 0 ? gameStatus.count : '--';
      var p = (gameStatus.count > 0 && gameStatus.count < 10) ? '0' : '';
      if (countToShow === '--') {
          $('.count').text('--');
      } else {
          $('.count').text(p + (gameStatus.count + ''));
      }
    }

    function playSequence(){
      gameStatus.lock = true; // Lock input while sequence plays
      $('.push').removeClass('clickable').addClass('unclickable');
      clearTimeout(gameStatus.playerTimeoutHandle); // Clear player timeout

      let i = 0;
      gameStatus.playerSequenceIndex = 0; // Reset player's current position in sequence

      function playNextInSequence() {
        if (i < gameStatus.sequence.length) {
          displayCount(); // Update count before playing tone
          playGoodTone(gameStatus.sequence[i]);
          setTimeout(function() {
            stopGoodTones();
            i++;
            setTimeout(playNextInSequence, gameStatus.timeStep / 4); // Pause between tones
          }, gameStatus.timeStep / 2 -10); // Duration of tone
        } else {
          // Sequence finished playing
          gameStatus.lock = false; // Unlock for player input
          $('.push').removeClass('unclickable').addClass('clickable');
          // Set a timeout for the player to make their first move in the sequence
          gameStatus.playerTimeoutHandle = setTimeout(function() {
            if (!gameStatus.lock) { // If player hasn't started inputting yet
                notifyError(); // Player took too long
            }
          }, 5 * gameStatus.timeStep); // Player has 5x timeStep to react
        }
      }
      playNextInSequence(); // Start playing the sequence
    };

    function addStep(){
      gameStatus.count++; // Increment level/count
      // Update timeStep based on new count (makes game faster)
      gameStatus.timeStep = setTimeStep(gameStatus.count); 
      gameStatus.sequence.push(Math.floor(Math.random()*4).toString()); // Add new random step (0-3) as string
      
      // Short delay before playing the new sequence
      setTimeout(playSequence, 500); 
    };

    function resetTimers(){
      clearTimeout(gameStatus.errorTimeoutHndl);
      clearTimeout(gameStatus.sequencePlayTimeoutHndl);
      clearInterval(gameStatus.winSequenceHndl);
      clearTimeout(gameStatus.winToneTimeoutHndl);
      clearInterval(gameStatus.flashIntervalHndl);
      clearTimeout(gameStatus.flashOffTimeoutHndl);
      clearTimeout(gameStatus.playerTimeoutHandle);
      clearInterval(gameStatus.sequenceIntervalHndl); // Was gameStatus.seqHndl in original
    };

    function pushColor(pushObj){ // pushObj is the jQuery object of the clicked button
      if(!gameStatus.lock) { // Only if game is not locked (player's turn)
        clearTimeout(gameStatus.playerTimeoutHandle); // Player made a move, clear timeout

        var pushedID = pushObj.attr('id'); // Get ID of clicked button ("0", "1", "2", or "3")
        
        playGoodTone(pushedID); // Light up and play tone for the button player pressed
        // Don't stop tone immediately, let it play for its duration

        if( pushedID == gameStatus.sequence[gameStatus.playerSequenceIndex] ) { // Correct button
          gameStatus.playerSequenceIndex++;

          if(gameStatus.playerSequenceIndex >= gameStatus.sequence.length){ // Player completed the sequence
            if (gameStatus.count == 20) { // Winning condition
                $('.push').removeClass('clickable').addClass('unclickable');
                setTimeout(function(){ stopGoodTones(); notifyWin(); }, gameStatus.timeStep / 2);
            } else {
                $('.push').removeClass('clickable').addClass('unclickable');
                setTimeout(function(){ stopGoodTones(); addStep(); }, gameStatus.timeStep / 2); // Add next step after a brief pause
            }
          } else {
            // Player is still inputting current sequence, reset timeout for next input
            gameStatus.playerTimeoutHandle = setTimeout(function() {
                if (!gameStatus.lock) notifyError();
            }, 5 * gameStatus.timeStep);
            // Keep the tone playing for a bit then stop
            setTimeout(stopGoodTones, gameStatus.timeStep / 4);

          }
        } else { // Incorrect button
          $('.push').removeClass('clickable').addClass('unclickable');
          setTimeout(function(){ stopGoodTones(); notifyError(pushObj); }, gameStatus.timeStep / 4);
        }
      }
    }

    $('.push').mousedown(function(){
      // audioCtx.resume(); // Good place to resume context on user interaction
      if ($('#pwr-sw').hasClass('sw-on') && !gameStatus.lock) { // Only if power is on and not locked
         pushColor($(this));
      }
    });

    // $('*').mouseup(function(e){ // This global mouseup might be too broad
    $(document).mouseup(function(e){ 
      // e.stopPropagation(); // Not always needed, can interfere
      if ($('#pwr-sw').hasClass('sw-on') && !gameStatus.lock && gameStatus.currPush) { // Only if power is on, not locked, and a button was pushed
         stopGoodTones();
      }
    });


    function toggleStrict(){
      if ($('#pwr-sw').hasClass('sw-on')) { // Only if power is on
        $('#mode-led').toggleClass('led-on');
        gameStatus.strict = !gameStatus.strict;
      }
    }

    $('.sw-slot').click(function(){
      $('#pwr-sw').toggleClass('sw-on');
      if($('#pwr-sw').hasClass('sw-on') == false){ // Power turned OFF
        gameStatus.reset(); // Reset game logic
        $('.count').text('--').addClass('led-off');
        $('#mode-led').removeClass('led-on'); // Strict LED off
        $('.push').removeClass('clickable').addClass('unclickable'); // Make buttons unclickable
        $('#start').off('click', gameStart); // Remove event handlers
        $('#mode').off('click', toggleStrict);
        // $('.btn').removeClass('unclickable').addClass('clickable'); // Original had this, seems contradictory
        resetTimers(); // Clear all timers
        stopGoodTones(); // Stop any playing tones
        stopErrTone();
      } else { // Power turned ON
        // $('.btn').removeClass('unclickable').addClass('clickable'); // Not sure about '.btn' class
        $('.count').removeClass('led-off');
        $('#start').on('click', gameStart);
        $('#mode').on('click', toggleStrict);
        // Do not make .push clickable here, gameStart/playSequence will handle it
      }
    });

    // Initial state setup
    gameStatus.reset();
    $('.count').text('--').addClass('led-off');
    $('.push').addClass('unclickable'); // Start with buttons unclickable until game starts via power switch

  } // End of else for AudioContext check
});
