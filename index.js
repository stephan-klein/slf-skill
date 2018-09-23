/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const questions = require('./questions');
const countries = require('./countries');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

const ANSWER_COUNT = 4;
const GAME_LENGTH = 5;
const players = ["Moni", "Stephan"];

let letter;

function startGame(newGame, handlerInput) {
  const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
  letter = getRandomLetter(countries);

  let speechOutput = newGame
    ? requestAttributes.t('NEW_GAME_MESSAGE', requestAttributes.t('GAME_NAME'))
    + requestAttributes.t('WELCOME_MESSAGE', letter, players[0])
    : '';

  const sessionAttributes = {};
  let repromptText = speechOutput;

  Object.assign(sessionAttributes, {
    speechOutput: repromptText,
    repromptText,
    score: 0
  });

  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t('GAME_NAME'), repromptText)
    .getResponse();
}

function handleUserGuess(userGaveUp, handlerInput) {
  const {requestEnvelope, attributesManager, responseBuilder} = handlerInput;
  const {intent} = requestEnvelope.request;

  const answerSlotValid = isAnswerSlotValid(intent, letter);

  let speechOutputAnalysis = '';

  const sessionAttributes = attributesManager.getSessionAttributes();
  let currentScore = parseInt(sessionAttributes.score, 10);
  const requestAttributes = attributesManager.getRequestAttributes();

  if (answerSlotValid) {
    currentScore += 1;
    speechOutputAnalysis = requestAttributes.t('ANSWER_CORRECT_MESSAGE');
  } else {
    if (!userGaveUp) {
      speechOutputAnalysis = requestAttributes.t('ANSWER_WRONG_MESSAGE');
    }
  }

  speechOutput = speechOutputAnalysis;
  speechOutput += requestAttributes.t(
    'NEXT_PLAYER'
  );

  let repromptText = speechOutput;

  Object.assign(sessionAttributes, {
    speechOutput: repromptText,
    repromptText,
    score: currentScore
  });

  return responseBuilder.speak(speechOutput)
    .reprompt(repromptText)
    .withSimpleCard(requestAttributes.t('GAME_NAME'), repromptText)
    .getResponse();
}

function getRandomLetter(category) {
  let letterArr = null;
  let i, l;

  for (i = 0; i < 20 && letterArr == null; i++) {
    l = String.fromCharCode(
      Math.floor(Math.random() * 26) + 97
    ).toUpperCase();

    letterArr = category.DE_DE[l];
    console.log("letterArr for letter:" + l + " = " + letterArr);
  }

  if (i === 20)
    console.log("Error: 20 times no data found in array");

  return letterArr != null ? l : null;
}

function isAnswerSlotValid(intent, letter) {
  console.log('start validating');
  const answerSlotFilled = intent
    && intent.slots
    && intent.slots.Answer
    && intent.slots.Answer.value;

  if (!answerSlotFilled)
    return false;

  let answer = intent.slots.Answer.value;

  console.log('validating' + answer + ', ' + answer.charAt(0));

  console.log(letter);
  let letterArr = countries.DE_DE[letter];
  console.log(letterArr);
  let normAnswer = answer.charAt(0).toUpperCase() + answer.substring(1).toLowerCase();

  console.log(normAnswer);

  let validResult = letterArr.includes(normAnswer);

  return answerSlotFilled
    && intent.slots.Answer.value.charAt(0).toUpperCase() === letter
    && validResult;
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
      QUESTIONS: questions.QUESTIONS_EN_US,
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
      CORRECT_ANSWER_MESSAGE: 'The correct answer is %s: %s. ',
      ANSWER_IS_MESSAGE: 'That answer is ',
      TELL_QUESTION_MESSAGE: 'Question %s. %s ',
      GAME_OVER_MESSAGE: 'You got %s out of %s questions correct. Thank you for playing!',
      SCORE_IS_MESSAGE: 'Your score is %s. ',
      NEXT_PLAYER: ''
    },
  },
  'en-US': {
    translation: {
      QUESTIONS: questions.QUESTIONS_EN_US,
      GAME_NAME: 'American Reindeer Trivia'
    },
  },
  'en-GB': {
    translation: {
      QUESTIONS: questions.QUESTIONS_EN_GB,
      GAME_NAME: 'British Reindeer Trivia'
    },
  },
  de: {
    translation: {
      QUESTIONS: questions.QUESTIONS_DE_DE,
      GAME_NAME: 'Moni versus Stephan',
      HELP_MESSAGE: 'Ich stelle dir %s Multiple-Choice-Fragen. Antworte mit der Zahl, die zur richtigen Antwort gehört. Sage beispielsweise eins, zwei, drei oder vier. Du kannst jederzeit ein neues Spiel beginnen, sage einfach „Spiel starten“. ',
      REPEAT_QUESTION_MESSAGE: 'Wenn die letzte Frage wiederholt werden soll, sage „Wiederholen“ ',
      ASK_MESSAGE_START: 'Möchten Sie beginnen?',
      HELP_REPROMPT: 'Wenn du eine Frage beantworten willst, antworte mit der Zahl, die zur richtigen Antwort gehört. ',
      STOP_MESSAGE: 'Möchtest du weiterspielen?',
      CANCEL_MESSAGE: 'OK, dann lass uns bald mal wieder spielen.',
      NO_MESSAGE: 'OK, spielen wir ein andermal. Auf Wiedersehen!',
      TRIVIA_UNHANDLED: 'Sagt eine Zahl beispielsweise zwischen 1 und %s',
      HELP_UNHANDLED: 'Sage ja, um fortzufahren, oder nein, um das Spiel zu beenden.',
      START_UNHANDLED: 'Du kannst jederzeit ein neues Spiel beginnen, sage einfach „Spiel starten“.',
      NEW_GAME_MESSAGE: 'Willkommen bei %s. ',
      WELCOME_MESSAGE: 'Nenne Länder mit dem Anfangsbuchstaben %s. %s beginnt.',
      ANSWER_WRONG_MESSAGE: 'Falsch. ',
      CORRECT_ANSWER_MESSAGE: 'Die richtige Antwort ist %s: %s. ',
      ANSWER_IS_MESSAGE: 'Diese Antwort ist ',
      TELL_QUESTION_MESSAGE: 'Frage %s. %s ',
      GAME_OVER_MESSAGE: 'Du hast %s von %s richtig beantwortet. Danke fürs Mitspielen!',
      SCORE_IS_MESSAGE: 'Dein Ergebnis ist %s. ',
      NEXT_PLAYER: 'Spieler'
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
    return startGame(true, handlerInput);
  },
};


const HelpIntent = {
  canHandle(handlerInput) {
    const {request} = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const newGame = !(sessionAttributes.questions);
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
    } else if (sessionAttributes.questions) {
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
    if (sessionAttributes.questions) {
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