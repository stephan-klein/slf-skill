/* eslint-disable  func-names */
/* eslint-disable  no-console */

//TODO: Slots chosen by Amazon (e.g Color = Fuchsie) are not always right therefore data needs to be mapped to custom slot type.

const Alexa = require('ask-sdk-core');
const data = require('./data_de');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

const ANSWER_COUNT = 4;
const GAME_LENGTH = 5;
/*const playersInit = [
  {name: "Moni", wrongThisRound: false, score: 0},
  {name: "Stephan", wrongThisRound: false, score: 0}
];*/
const catsInit = [
  {name: "COUNTRIES", slot: "CountryAnswer"},
  {name: "CAPITALS", slot: "CityAnswer"},
  {name: "ANIMALS", slot: "AnimalAnswer"},
  {name: "COLORS", slot: "ColorAnswer"}];

function startGame(newGame, handlerInput, playerNames) {
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  console.log("startGame executed, requestEnvelope: " + JSON.stringify(handlerInput.requestEnvelope) + " playerNames=" + playerNames);

  let playersInit = [];
  for (let i = 0; i < playerNames.length; i++) {
    playersInit.push({name: playerNames[i], wrongThisRound: false, score: 0});
  }

  //let players = shuffle(playersInit);
  let players = playersInit;
  console.log("Players shuffled: " + JSON.stringify(players));
  let cats = shuffle(catsInit);
  console.log("Cats shuffled: " + JSON.stringify(cats));

  let catIndex = 0;
  let cat = cats[catIndex];

  let playerIndex = 0;
  let player = players[playerIndex];

  let letter = getRandomLetter(data[cat.name]);

  console.log("startGame with letter " + letter + " and category " + cat.name);

  let speechOutput = newGame
    ? requestAttributes.t('NEW_GAME_MESSAGE', requestAttributes.t('GAME_NAME'))
    + requestAttributes.t('WELCOME_MESSAGE', requestAttributes.t(cat.name), "\"" + letter + "\"", player.name)
    : '';

  const sessionAttributes = {};
  let repromptText = speechOutput;

  Object.assign(sessionAttributes, {
    speechOutput: repromptText,
    repromptText,
    letter: letter,
    players: players,
    playerIndex: playerIndex,
    givenAnswers: [],
    cats: cats,
    catIndex: catIndex
  });

  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t('GAME_NAME'), repromptText)
    //.addElicitSlotDirective('CountryAnswer') This does not work - needed ?
    .getResponse();
}

function handleUserGuess(userGaveUp, handlerInput) {
  console.log("handleUserGuess started, userGaveUp=" + userGaveUp);
  const {requestEnvelope, attributesManager, responseBuilder} = handlerInput;
  const {intent} = requestEnvelope.request;
  const sessionAttributes = attributesManager.getSessionAttributes();
  const requestAttributes = attributesManager.getRequestAttributes();

  let speechOutputAnalysis = '';


  let players = sessionAttributes.players;
  let playerIndex = parseInt(sessionAttributes.playerIndex, 10);

  let cats = sessionAttributes.cats;
  let catIndex = parseInt(sessionAttributes.catIndex);

  let correctAnswers = sessionAttributes.givenAnswers;
  let letter = sessionAttributes.letter;

  if (intent != null) {
    console.log("Intent is: " + JSON.stringify(intent));
  }


  console.log("Session attributes are: " + JSON.stringify(sessionAttributes));
  let normAnswer = isAnswerSlotValid(intent, letter, cats[catIndex].slot, data[cats[catIndex].name]);
  if (normAnswer != null && !userGaveUp) {
    if (!answerAlreadyGiven(normAnswer, correctAnswers)) {
      players[playerIndex].score++;
      players[playerIndex].wrongThisRound = false;
      speechOutputAnalysis = requestAttributes.t('ANSWER_CORRECT_MESSAGE');
    } else {
      players[playerIndex].wrongThisRound = true;
      speechOutputAnalysis = requestAttributes.t('ANSWER_ALREADY_GIVEN_MESSAGE');
    }
  } else {
    players[playerIndex].wrongThisRound = true;
    if (!userGaveUp) {
      speechOutputAnalysis = requestAttributes.t('ANSWER_WRONG_MESSAGE');
    }
  }

  let speechOutput = speechOutputAnalysis;
  playerIndex++;

  if (playerIndex === players.length) {
    //End of Round
    playerIndex = 0;

    if (roundOver(players)) {
      console.log("Round is over");
      catIndex++;

      if (catIndex < cats.length) {
        console.log("Next category");
        speechOutput += requestAttributes.t('ROUND_OVER_MESSAGE') + getRankingPrompt(players, requestAttributes);
        let cat = cats[catIndex];
        letter = getRandomLetter(data[cat.name]);

        speechOutput +=
          requestAttributes.t('NEXT_ROUND_MESSAGE') +
          requestAttributes.t('WELCOME_MESSAGE', requestAttributes.t(cat.name), "\"" + letter + "\"", players[playerIndex].name);
      } else {
        console.log("Game is over");
        speechOutput += requestAttributes.t('GAME_OVER_MESSAGE') + getRankingPrompt(players, requestAttributes) + requestAttributes.t('THANK_YOU_MESSAGE');

        return responseBuilder.speak(speechOutput)
          .withSimpleCard(requestAttributes.t('GAME_NAME'), speechOutput)
          .getResponse();
      }
    } else {
      console.log("Next Round");
      speechOutput += players[playerIndex].name + ".";
    }
  } else {
    console.log("Next Player");
    speechOutput += players[playerIndex].name + ".";
  }

  let repromptText = players[playerIndex].name + ".";

  Object.assign(sessionAttributes, {
    speechOutput: speechOutput,
    repromptText,
    letter: letter,
    players: players,
    playerIndex: playerIndex,
    givenAnswers: correctAnswers,
    cats: cats,
    catIndex: catIndex
  });

  return responseBuilder.speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t('GAME_NAME'), speechOutput)
    .getResponse();
}

function roundOver(players) {
  console.log("roundOver started");

  let allWrong = true;
  for (let i = 0; i < players.length; i++) {
    allWrong &= players[i].wrongThisRound;
  }

  return allWrong;
}

function getRankingPrompt(players, requestAttributes) {
  let rankingPrompt = '';

  let ranking = (players.concat()).sort((a, b) => (a.score < b.score) ? 1 : ((b.score < a.score) ? -1 : 0));
  console.log("Ranking is " + JSON.stringify(ranking));

  for (let i = 0; i < ranking.length; i++) {
    rankingPrompt += requestAttributes.t('RANKING_MESSAGE', ranking[i].name, ranking[i].score)
  }

  return rankingPrompt;
}

function getRandomLetter(category) {
  let letterArr = null;
  let i, l;

  for (i = 0; i < 20 && letterArr == null; i++) {
    l = String.fromCharCode(
      Math.floor(Math.random() * 26) + 97
    );

    if (category[l] !== undefined)
      if (category[l].length > 5)
        letterArr = category[l];

    console.log("letterArr for letter:" + l + " = " + letterArr);
  }

  if (i === 20)
    console.log("Error: 20 times no data found in array");

  return letterArr != null ? l : null;
}

function isAnswerSlotValid(intent, letter, slot, cat) {
  console.log('isAnswerSlotValid started with letter: ' + letter + ', slot:' + slot + ', cat:' + cat);

  let answerSlotFilled = intent
    && intent.slots;

  let value = null;
  if (answerSlotFilled) {
    Object.keys(intent.slots).forEach(function (slot) {
      console.log('Slot ' + intent.slots[slot].name + ' has value ' + intent.slots[slot].value);
      if (intent.slots[slot].value !== undefined) {
        value = intent.slots[slot].value;
      }
    });
  }
  answerSlotFilled = answerSlotFilled && value;

  if (!answerSlotFilled) {
    console.log('No slot filled');
    return null;
  }

  let answer = value;

  console.log('Validating ' + answer + ', ' + answer.charAt(0) + ' for letter ' + letter);
  let letterArr = cat[letter];
  console.log('List of valid answers: ' + letterArr);

  //Normalizing the answer
  let normAnswer = answer.toLowerCase();

  if (letterArr.includes(normAnswer)) {
    console.log('Normalized Answer included: ' + normAnswer + ". Answer is valid");
    return normAnswer;
  } else {
    console.log('Normalized Answer not included: ' + normAnswer + ". Answer is invalid");
    return null;
  }
}

function answerAlreadyGiven(normAnswer, givenAnswers) {
  if (givenAnswers.includes(normAnswer)) {
    console.log('Answer already given');
    return true;
  } else {
    givenAnswers.push(normAnswer);
    return false;
  }
}

function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function helpTheUser(newGame, handlerInput) {
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  const askMessage = newGame
    ? requestAttributes.t('ASK_MESSAGE_START')
    : requestAttributes.t('REPEAT_QUESTION_MESSAGE') + requestAttributes.t('STOP_MESSAGE');
  const speechOutput = requestAttributes.t('HELP_MESSAGE', GAME_LENGTH) + askMessage;
  const repromptText = requestAttributes.t('HELP_REPROMPT') + askMessage;

  return handlerInput.responseBuilder.speak(speechOutput).reprompt(repromptText).getResponse();
}

/* jshint -W101 */
const languageString = {
  en: {
    translation: {
      GAME_NAME: 'Reindeer Trivia',
      HELP_MESSAGE: 'I will ask you %s multiple choice questions. Respond with the number of the answer. For example, say one, two, three, or four. To start a new game at any time, say, start game. ',
      REPEAT_QUESTION_MESSAGE: 'To repeat the last question, say, repeat. ',
      ASK_MESSAGE_START: 'Would you like to start playing?',
      HELP_REPROMPT: 'To give an answer to a question, respond with the number of the answer. ',
      STOP_MESSAGE: 'Would you like to keep playing?',
      CANCEL_MESSAGE: 'Ok, let\'s play again soon.',
      NO_MESSAGE: 'Ok, we\'ll play another time. Goodbye!',
      TRIVIA_UNHANDLED: 'Try saying a number between 1 and %s',
      HELP_UNHANDLED: 'Say yes to continue, or no to end the game.',
      START_UNHANDLED: 'Say start to start a new game.',
      NEW_GAME_MESSAGE: 'Welcome to %s. ',
      WELCOME_MESSAGE: 'I will ask you %s questions, try to get as many right as you can. Just say the number of the answer. Let\'s begin. ',
      ANSWER_CORRECT_MESSAGE: 'correct. ',
      ANSWER_WRONG_MESSAGE: 'wrong. ',
      AND: 'and ',
      ANSWER_ALREADY_GIVEN_MESSAGE: 'nice try. ',
      CORRECT_ANSWER_MESSAGE: 'The correct answer is %s: %s. ',
      ANSWER_IS_MESSAGE: 'That answer is ',
      TELL_QUESTION_MESSAGE: 'Question %s. %s ',
      GAME_OVER_MESSAGE: 'Spiel vorbei. Hier das Endergebnis. ',
      THANK_YOU_MESSAGE: 'Danke fürs Mitspielen! ',
      SCORE_IS_MESSAGE: 'Your score is %s. ',
      ROUND_OVER_MESSAGE: 'Runde vorbei. ',
      NEXT_ROUND_MESSAGE: 'Nächste Runde. ',
      RANKING_MESSAGE: '%s hat %s Punkte. ',
      NEXT_PLAYER: '',
      COUNTRIES: 'Countries', CAPITALS: 'Capitals', CARS: 'Cars', ANIMALS: 'Animals', COLORS: 'Colors'
    },
  },
  'en-US': {
    translation: {
      GAME_NAME: 'American Reindeer Trivia'
    },
  },
  'en-GB': {
    translation: {
      GAME_NAME: 'British Reindeer Trivia'
    },
  },
  de: {
    translation: {
      GAME_NAME: 'Stadt Land Fluss',
      HELP_MESSAGE: 'Der Spieler an der Reihe muss einen Begriff mit dem richtigen Anfangsbuchstaben in der jeweiligen Kategorie nennen. Um die Namen oder Anzahl der Spieler zu bestimmen, starte das Spiel beispielsweise mit „Starte Stadt Land Fluss mit Monika und Stephan“ oder „Starte Stadt Land Fluss mit Fünf Spielern“. ',
      REPEAT_QUESTION_MESSAGE: 'Wenn dir nichts einfällt sage „Passe“ oder „Keine Ahnung“. ',
      ASK_MESSAGE_START: 'Möchten Sie beginnen?',
      HELP_REPROMPT: 'Wenn du eine Frage beantworten willst, antworte mit der Zahl, die zur richtigen Antwort gehört. ',
      STOP_MESSAGE: 'Möchtest du weiterspielen?',
      CANCEL_MESSAGE: 'OK, dann lass uns bald mal wieder spielen.',
      NO_MESSAGE: 'OK, spielen wir ein andermal. Auf Wiedersehen!',
      TRIVIA_UNHANDLED: 'Sagt eine Zahl beispielsweise zwischen 1 und %s',
      HELP_UNHANDLED: 'Sage ja, um fortzufahren, oder nein, um das Spiel zu beenden.',
      START_UNHANDLED: 'Du kannst jederzeit ein neues Spiel beginnen, sage einfach „Spiel starten“.',
      NEW_GAME_MESSAGE: 'Willkommen bei %s. ',
      WELCOME_MESSAGE: 'Nenne %s mit dem Anfangsbuchstaben %s. %s beginnt.',
      ANSWER_WRONG_MESSAGE: 'Falsch. ',
      ANSWER_CORRECT_MESSAGE: 'Richtig. ',
      AND: ' und ',
      ANSWER_ALREADY_GIVEN_MESSAGE: 'Nice Try. ',
      CORRECT_ANSWER_MESSAGE: 'Die richtige Antwort ist %s: %s. ',
      ANSWER_IS_MESSAGE: 'Diese Antwort ist ',
      TELL_QUESTION_MESSAGE: 'Frage %s. %s ',
      GAME_OVER_MESSAGE: 'Spiel zu Ende. Hier das Endergebnis. ',
      THANK_YOU_MESSAGE: 'Danke fürs Mitspielen! ',
      SCORE_IS_MESSAGE: 'Dein Ergebnis ist %s. ',
      ROUND_OVER_MESSAGE: 'Runde vorbei. ',
      NEXT_ROUND_MESSAGE: 'Nächste Runde. ',
      RANKING_MESSAGE: '%s hat %s Punkte. ',
      NEXT_PLAYER: 'Spieler',
      COUNTRIES: 'Länder', CAPITALS: 'Hauptstädte', CARS: 'Autos', ANIMALS: 'Tiere', COLORS: 'Farben'
    },
  },
};


const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      resources: languageString,
      returnObjects: true
    });

    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) {
      return localizationClient.t(...args);
    };
  },
};

const LaunchRequest = {
  canHandle(handlerInput) {
    const {request} = handlerInput.requestEnvelope;

    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'AMAZON.StartOverIntent');
  },
  handle(handlerInput) {
    return startGame(true, handlerInput, ["Spieler 1", "Spieler 2"]);
  },
};

const SetPlayerCountIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'SetPlayerCountIntent')
      && (handlerInput.requestEnvelope.request.intent.slots.number.value < 7);
  },
  handle(handlerInput) {
    return startGame(true, handlerInput, ["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4", "Spieler 5", "Spieler 6"].slice(0, handlerInput.requestEnvelope.request.intent.slots.number.value));
  },
};

const SetPlayersIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'SetPlayersIntent');
  },
  handle(handlerInput) {
    let players = handlerInput.requestEnvelope.request.intent.slots.name.value;
    return startGame(true, handlerInput, players.split(" "));
  },
};

const HelpIntent = {
  canHandle(handlerInput) {
    const {request} = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const newGame = !(sessionAttributes.letter);
    return helpTheUser(newGame, handlerInput);
  },
};

const UnhandledIntent = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    if (Object.keys(sessionAttributes).length === 0) {
      const speechOutput = requestAttributes.t('START_UNHANDLED');
      return handlerInput.attributesManager
        .speak(speechOutput)
        .reprompt(speechOutput)
        .getResponse();
    } else if (sessionAttributes.letter) {
      const speechOutput = requestAttributes.t('TRIVIA_UNHANDLED', ANSWER_COUNT.toString());
      return handlerInput.attributesManager
        .speak(speechOutput)
        .reprompt(speechOutput)
        .getResponse();
    }
    const speechOutput = requestAttributes.t('HELP_UNHANDLED');
    return handlerInput.attributesManager.speak(speechOutput).reprompt(speechOutput).getResponse();
  },
};

const SessionEndedRequest = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const AnswerIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AnswerIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'DontKnowIntent');
  },
  handle(handlerInput) {
    if (handlerInput.requestEnvelope.request.intent.name === 'AnswerIntent') {
      return handleUserGuess(false, handlerInput);
    }
    return handleUserGuess(true, handlerInput);
  },
};

const RepeatIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.responseBuilder.speak(sessionAttributes.speechOutput)
      .reprompt(sessionAttributes.repromptText)
      .getResponse();
  },
};

const YesIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (sessionAttributes.letter) {
      return handlerInput.responseBuilder.speak(sessionAttributes.speechOutput)
        .reprompt(sessionAttributes.repromptText)
        .getResponse();
    }
    return startGame(false, handlerInput);
  },
};


const StopIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speechOutput = requestAttributes.t('STOP_MESSAGE');

    return handlerInput.responseBuilder.speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const CancelIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speechOutput = requestAttributes.t('CANCEL_MESSAGE');

    return handlerInput.responseBuilder.speak(speechOutput)
      .getResponse();
  },
};

const NoIntent = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speechOutput = requestAttributes.t('NO_MESSAGE');
    return handlerInput.responseBuilder.speak(speechOutput).getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequest,
    SetPlayerCountIntent,
    SetPlayersIntent,
    HelpIntent,
    AnswerIntent,
    RepeatIntent,
    YesIntent,
    StopIntent,
    CancelIntent,
    NoIntent,
    SessionEndedRequest,
    UnhandledIntent
  )
  .addRequestInterceptors(LocalizationInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();