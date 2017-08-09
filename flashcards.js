const inquirer = require("inquirer");
const library = require("./cardLibrary.json");
const BasicCard = require("./BasicCard.js")
const ClozeCard = require("./ClozeCard.js")
const colors = require('colors');
const fs = require("fs");

var drawnCard;
var playedCard;
var count = 0;

function openMenu() {
  inquirer.prompt([														
      {
          type: "list",														
          message: "Choose a menu option from the list below:",	
          choices: ["Create a Flashcard", "Go Through All Flashcards", "One Random Flashcard", "Shuffle All Flashcards for Later Use", "Show All Flashcards", "Exit"],	
          name: "menuOptions"												
      }
  ]).then(function (answer) {											
    var waitMsg;

    switch (answer.menuOptions) {

        case 'Create a Flashcard':
            createCard();
            break;

        case 'Go Through All Flashcards':
            console.log("Starting at the beginning:");
            waitMsg = setTimeout(askQuestions, 2000);
            break;

        case 'One Random Flashcard':
            console.log("Here's a random card:");
            waitMsg = setTimeout(randomCard, 2000);
            break;

        case 'Shuffle All Flashcards for Later Use':
            console.log("Shuffling cards...");
            waitMsg = setTimeout(shuffleDeck, 2000);
            break;

        case 'Show All Flashcards':
            console.log("Here are all the cards I have:");
            waitMsg = setTimeout(showCards, 2000);
            break;

        case 'Exit':
            console.log(colors.blue("\nThank you for using the Basic-Flashcard-Generator. Bye!\n"));
            return;
            break;

        default:
            console.log("Sorry I don't understand");
    }

  });

}

openMenu();

function createCard() {
    inquirer.prompt([
        {
            type: "list",
            message: "What type of flashcard do you want to create?",
            choices: ["Basic Card", "Cloze Card"],
            name: "cardType"
        }

    ]).then(function (appData) {

        var cardType = appData.cardType;  			//the variable cardType will store the choice from the cardType inquirer object.
        console.log(cardType);			  			

        if (cardType === "Basic Card") {
            inquirer.prompt([
                {
                    type: "input",
                    message: "Please fill out the front of your card (Your Question).",
                    name: "front"
                },

                {
                    type: "input",
                    message: "Please fill out the back of your card (Your Answer).",
                    name: "back"
                }

            ]).then(function (cardData) {

                var cardObj = {						//builds an object with front and back info
                    type: "BasicCard",
                    front: cardData.front,
                    back: cardData.back
                };
                library.push(cardObj);				//push the new card into the array of cards
                fs.writeFile("cardLibrary.json", JSON.stringify(library, null, 2)); //write the updated array to the carLibrary.json file

                inquirer.prompt([					//keep making cards?
                    {
                        type: "list",
                        message: "Do you want to create another card?",
                        choices: ["Yes", "No"],
                        name: "anotherCard"
                    }

                ]).then(function (appData) {				
                    if (appData.anotherCard === "Yes") {	
                        createCard();						
                    } else {								
                        openMenu();			//reopen the main menu to the user
                    }
                });
            });

        } else {						
            inquirer.prompt([
                {
                    type: "input",
                    message: "Please type out the full text of your statement (remove cloze in next step).",
                    name: "text"
                },

                {
                    type: "input",
                    message: "Please type the portion of text you want to cloze. This part will be replaced with '...'.",
                    name: "cloze"
                }

            ]).then(function (cardData) {            //once we have the users cloze data run this function

                var cardObj = {						
                    type: "ClozeCard",
                    text: cardData.text,
                    cloze: cardData.cloze
                };
                if (cardObj.text.indexOf(cardObj.cloze) !== -1) {   //checking to make sure the Cloze matches some text in the statement
                    library.push(cardObj);							
                    fs.writeFile("cardLibrary.json", JSON.stringify(library, null, 2)); 
                } else {											//if the cloze doesnt match then give a message to the user.
                    console.log("Sorry, The cloze must match the word(s) in the text on the front of the card.");

                }
                inquirer.prompt([					
                    {
                        type: "list",
                        message: "Do you want to create another card?",
                        choices: ["Yes", "No"],
                        name: "anotherCard"
                    }

                ]).then(function (appData) {				
                    if (appData.anotherCard === "Yes") {	
                        createCard();						//call the create card function again (recursion)
                    } else {							
                        openMenu();		
                    }
                });
            });
        }

    });
};

//function used to get the question from the drawnCard in the askQuestions function
function getQuestion(card) {
    if (card.type === "BasicCard") {						
        drawnCard = new BasicCard(card.front, card.back);	
        return drawnCard.front;								
    } else if (card.type === "ClozeCard") {					
        drawnCard = new ClozeCard(card.text, card.cloze)	
        return drawnCard.clozeRemoved();					//Return the ClozeCard prototpe method clozeRemoved to show the question missing the cloze
    }
};

function askQuestions() {
    if (count < library.length) {					//if current count (starts at 0) is less than the number of cards in the library....
        playedCard = getQuestion(library[count]);	//playedCard stores the question from the card with index equal to the current counter.
        inquirer.prompt([							
            {
                type: "input",
                message: playedCard,
                name: "question"
            }
        ]).then(function (answer) {				
        	//if the users answer equals .back or .cloze of the playedCard run a message "You are correct."
            if (answer.question === library[count].back || answer.question === library[count].cloze) {
                console.log(colors.green("You are correct!"));
            } else {
                if (drawnCard.front !== undefined) { //if card has a front then it is a Basic card
                    console.log(colors.red("Sorry, the correct answer was ") + library[count].back); //grabs & shows correct answer
                } else { // otherwise it is a Cloze card
                    console.log(colors.red("Sorry, the correct answer was ") + library[count].cloze);//grabs & shows correct answer
                }
            }
            count++; 		//increase the counter for the next run through
            askQuestions();         //recursion
        });
    } else {
        console.log("THE END!");
      	count=0;			//reset counter to 0 once loop ends
      	setTimeout(openMenu, 2000);			
    }
};

function shuffleDeck() {
  newDeck = library.slice(0); //copy the flashcards into a new array
  for (var i = library.length - 1; i > 0; i--) {            //Fisher-Yates shuffle

      var getIndex = Math.floor(Math.random() * (i + 1));
      var shuffled = newDeck[getIndex];
      newDeck[getIndex] = newDeck[i];
      newDeck[i] = shuffled;
  }
  fs.writeFile("cardLibrary.json", JSON.stringify(newDeck, null, 2)); //write the new randomized array over the old one
  console.log(colors.cyan("The deck of flashcards has been shuffled\nRestart the application to run through the shuffled cards")); //card Indx values do not update until app is restarted
//   inquirer.prompt([
//         {
//             type: "list",
//             message: "Would you like to run through the shuffled cards now?",
//             choices: ["Yes", "No"],
//             name: "shuffleRun"
//         }

//     ]).then(function (appData) {

//         var shuffleRun = appData.shuffleRun;  			//the variable shuffleRun will store the choice from the shuffleRun inquirer object.		  			

//         if (shuffleRun === "Yes") {
//             console.log("Starting at the beginning:");
//             waitMsg = setTimeout(askQuestions, 1000);
//         } else {								
//             openMenu();			
//         }
//     });
};

function randomCard() {
  var randomNumber = Math.floor(Math.random() * (library.length - 1));  // get a random index number within the length of the current library

  playedCard = getQuestion(library[randomNumber]);	//playedCard stores the question from the card with index equal to the randomNumber.
        inquirer.prompt([							
            {
                type: "input",
                message: playedCard,
                name: "question"
            }
        ]).then(function (answer) {					
            if (answer.question === library[randomNumber].back || answer.question === library[randomNumber].cloze) {
                console.log(colors.green("You are correct!"));
                	setTimeout(openMenu, 2000);
            } else {
                if (drawnCard.front !== undefined) { 
                    console.log(colors.red("Sorry, the correct answer was ") + library[randomNumber].back); 
                    	setTimeout(openMenu, 2000);
                } else { 
                    console.log(colors.red("Sorry, the correct answer was ") + library[randomNumber].cloze);
                    	setTimeout(openMenu, 2000);
                }
            }
        });

};

//function to print all cards on screen for user to read through
function showCards () {

  var library = require("./cardLibrary.json");

  if (count < library.length) {                     //if counter stays below the length of the library array
    //currentCard = getQuestion(library[count]);      //currentCard variable becomes

    if (library[count].front !== undefined) { //if card has a front then it is a Basic card
        console.log(colors.blue("\nBasic Card ---------------------------------------"));
        console.log("\nFront: " + library[count].front); //grabs & shows card question
        console.log("------------------------------------------------");
        console.log("Back: " + library[count].back + "."); //grabs & shows card question
        console.log(colors.blue("\n---------------------------------------------------"));
        console.log("");

    } else { // otherwise it is a Cloze card
        console.log(colors.blue("\nCloze Card --------------------------------------"));
        console.log("\nText: " + library[count].text); //grabs & shows card question
        console.log("------------------------------------------------");
        console.log("Cloze: " + library[count].cloze + "."); //grabs & shows card question
        console.log(colors.blue("\n--------------------------------------------------"));
        console.log("");
    }
    count++;		//increase the counter each round
    showCards();	//re-call the function with in itself. recursion.
  } else {
    count=0;		//reset counter to 0 once loop ends
    openMenu();		//call the menu for the user to continue using the app
  }
}
