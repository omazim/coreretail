var SpeechUtil = (function () {
        var speech, recognition;
        var me = {        
                active: false,
                click: function () {
                    if (this.active) {
                        recognition.stop();
                        this.active = false;
                    } else {
                        this.init();
                    }
                    this.cueState();
                },
                init: function () {
                    var that = this;
                    try {
                        speech = window.SpeechRecognition || window.webkitSpeechRecognition;
                        recognition = new speech();
                        if (speech && recognition) {
                            this.active = true;
                            // If false, the recording will stop after a few seconds of silence.
                            // When true, the silence period is longer (about 15 seconds),
                            // allowing us to keep recording even when the user pauses. 
                            recognition.continuous = true;
                            //recognition.interimResults = true;
                            recognition.start();
                        }                        
                        recognition.onresult = function(event) {
                            // write to the field in focus.
                            // event is a SpeechRecognitionEvent object.
                            // It holds all the lines we have captured so far. 
                            // We only need the current one.
                            var curr = event.resultIndex,
                                el = document.activeElement,
                            // Get a transcript of what was said.
                                transcript = event.results[curr][0].transcript,
                            // Add the current transcript to the contents of our Note.
                            // There's a weird bug on mobile, where everything is repeated twice.
                            // There's no official solution so we have to handle an edge case.
                                repeatBug = (curr === 1 && transcript === event.results[0][0].transcript);
                            console.log("write " + transcript + " into field " + el.id);
                            if (!repeatBug && $(el).hasClass(AI.htmlClass.groupField)) {
                                if (el.nodeName === "INPUT") {
                                    el.value += transcript;
                                    CtrlUtil.fieldChangeHandler({target: el});
                                }
                            }
                        };
                        
                        recognition.onstart = function () {
                            var msg = {msg:"Speech recognition has been activated.", type:"info"};
                            ViewUtil.feedback.give(msg);                            
                        };

                        recognition.onspeechend = function() {
                            that.active = false;
                            that.cueState();
                            ViewUtil.feedback.give({msg:"You were quiet for a while so voice recognition turned itself off.",type:"info"});
                        };

                        recognition.onerror = function(event) {
                            if (event.error === 'no-speech') {
                                that.active = false;
                                that.cueState();
                                ViewUtil.feedback.give({msg:"No speech was detected. Please try again.",type:"err"});  
                            };                            
                        };
                    }
                    catch(err) {
                        console.log(err);
                        this.active === false;
                        ViewUtil.feedback.give({msg: "Sorry, your browser does not yet support speech recognition. Try updating it.", type:"info"});
                    }
                },
                cueState: function () {
                    var addIcon = (this.active)? "fa-microphone": "fa-microphone-slash",
                        removeIcon = (this.active)? "fa-microphone-slash": "fa-microphone",
                        msg = (this.active)? "Speak into your device's microphone when you focus on any field to enter data.": "Speech recognition has been turned off.",
                        feedback = {
                            msg: msg,
                            type: "info"
                        },
                        mic = $("#" + AI.htmlId.speechToText);
                        ViewUtil.feedback.give(feedback);
                    mic.find("i").addClass(addIcon).removeClass(removeIcon);
                    StyleUtil.flash(mic, this.active);                   
                }
            };
        return me;
    })();
/*
* try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}


var noteTextarea = $('#note-textarea');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';

// Get all notes from previous sessions and display them.
var notes = getAllNotes();
renderNotes(notes);



/*-----------------------------
      Voice Recognition 
------------------------------

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses. 
recognition.continuous = true;

// This block is called every time the Speech APi captures a line. 
recognition.onresult = function(event) {

  // event is a SpeechRecognitionEvent object.
  // It holds all the lines we have captured so far. 
  // We only need the current one.
  var current = event.resultIndex;

  // Get a transcript of what was said.
  var transcript = event.results[current][0].transcript;

  // Add the current transcript to the contents of our Note.
  // There is a weird bug on mobile, where everything is repeated twice.
  // There is no official solution so far so we have to handle an edge case.
  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

  if(!mobileRepeatBug) {
    noteContent += transcript;
    noteTextarea.val(noteContent);
  }
};

recognition.onstart = function() { 
  instructions.text('Voice recognition activated. Try speaking into the microphone.');
}

recognition.onspeechend = function() {
  instructions.text('You were quiet for a while so voice recognition turned itself off.');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
    instructions.text('No speech was detected. Try again.');  
  };
}



/*-----------------------------
      App buttons and input 
------------------------------

$('#start-record-btn').on('click', function(e) {
  if (noteContent.length) {
    noteContent += ' ';
  }
  recognition.start();
});


$('#pause-record-btn').on('click', function(e) {
  recognition.stop();
  instructions.text('Voice recognition paused.');
});

// Sync the text inside the text area with the noteContent variable.
noteTextarea.on('input', function() {
  noteContent = $(this).val();
})

$('#save-note-btn').on('click', function(e) {
  recognition.stop();

  if(!noteContent.length) {
    instructions.text('Could not save empty note. Please add a message to your note.');
  }
  else {
    // Save note to localStorage.
    // The key is the dateTime with seconds, the value is the content of the note.
    saveNote(new Date().toLocaleString(), noteContent);

    // Reset variables and update UI.
    noteContent = '';
    renderNotes(getAllNotes());
    noteTextarea.val('');
    instructions.text('Note saved successfully.');
  }
      
})


notesList.on('click', function(e) {
  e.preventDefault();
  var target = $(e.target);

  // Listen to the selected note.
  if(target.hasClass('listen-note')) {
    var content = target.closest('.note').find('.content').text();
    readOutLoud(content);
  }

  // Delete note.
  if(target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();  
    deleteNote(dateTime);
    target.closest('.note').remove();
  }
});



/*-----------------------------
      Speech Synthesis 
------------------------------

function readOutLoud(message) {
	var speech = new SpeechSynthesisUtterance();

  // Set the text and voice attributes.
	speech.text = message;
	speech.volume = 1;
	speech.rate = 1;
	speech.pitch = 1;
  
	window.speechSynthesis.speak(speech);
}



/*-----------------------------
      Helper Functions 
------------------------------

function renderNotes(notes) {
  var html = '';
  if(notes.length) {
    notes.forEach(function(note) {
      html+= `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
          <a href="#" class="delete-note" title="Delete">Delete</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;    
    });
  }
  else {
    html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
  }
  notesList.html(html);
}


function saveNote(dateTime, content) {
  localStorage.setItem('note-' + dateTime, content);
}


function getAllNotes() {
  var notes = [];
  var key;
  for (var i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);

    if(key.substring(0,5) == 'note-') {
      notes.push({
        date: key.replace('note-',''),
        content: localStorage.getItem(localStorage.key(i))
      });
    } 
  }
  return notes;
}


function deleteNote(dateTime) {
  localStorage.removeItem('note-' + dateTime); 
}


 */