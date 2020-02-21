const BACKEND_URL = "https://veff213-minesweeper.herokuapp.com/api/v1/minesweeper"
const BOMB_URL = "img/bomb.png";
const FLAG_URL = "img/flag.png";

const MIN_NUMERIC_INPUT = 1;
const MAX_NUMERIC_INPUT = 40;
const DEFAULT_NUMERIC_INPUT = 10;

const UNIT_WIDTH = 35;
const UNIT_HEIGHT = 35;

const gameStatus = document.getElementById("game-status");
const flagStatus = document.getElementById("flag-status");
let donePlaying = false;

let flagsLeft = 0;

//Colors
const unRevealedGray = "#dadddf";
const revealedGray = "#f0efef";
const victoryGreen = "#4dd599";
const red = "#ec7373";
const darkRed = "#9d2503";
const green = "#2c786c";
const blue = "#0f4c75";

//A class that represents a unit on the grid
class Unit{
    
    constructor(instance, yIndex, xIndex, isBomb=false){
        this.instance = instance;

        //Each unit knows it's x and y index in an array of units
        this.yIndex = yIndex;
        this.xIndex = xIndex;

        this.isBomb = isBomb;
        this.isFlagged = false;
        this.isRevealed = false;
        this.neighbourBombs = 0;
    }

    flag(){
        //Only place a flag if the unit hasn't been flagged or the user is out of flags
        if(!this.isRevealed && !this.isFlagged && flagsLeft > 0){
            this.instance.style.backgroundImage = "url(" + FLAG_URL + ")";
            this.instance.style.backgroundSize = "cover";
            this.isFlagged = true;
            decrementRemainingFlags();
        }
        //Remove the flag if the user right clicks on a flag
        else if(this.isFlagged){
            this.instance.style.backgroundImage = "none";
            this.isFlagged = false;
            incrementRemainingFlags();
        }
    }

    reveal(units){

        this.isRevealed = true;

        //Reveal the bomb image if the unit is a bomb
        if(this.isBomb){
            this.instance.style.backgroundImage = "url(" + BOMB_URL + ")";
            this.instance.style.backgroundSize = "cover";
            this.instance.style.backgroundColor = "red";
        }
        else{
            //See how many neighbours are bombs
            setNeighbourBombsValue(units, this.yIndex, this.xIndex);

            this.instance.style.backgroundColor = revealedGray;

            //If there are any bomb neighbours, display a number
            if (this.neighbourBombs > 0) {
                if(this.neighbourBombs === 1){
                    this.instance.style.color = blue;
                }
                else if(this.neighbourBombs === 2){
                    this.instance.style.color = green;
                }
                else if(this.neighbourBombs > 2){
                    this.instance.style.color = darkRed;
                }
                this.instance.textContent = String(this.neighbourBombs);
            }

            //No bombs are neighbours, then reveal all the neighbours
            else{
                revealNeighbours(units, this.yIndex, this.xIndex);
            } 
        }
    }
}

function validateGridInput(input){

    //If no input then default is returned
    if(!input || isNaN(input)){
        return DEFAULT_NUMERIC_INPUT;
    }

    let validatedInput = Number(input);

    //Numers below the minimum become the minimum
    if(validatedInput < MIN_NUMERIC_INPUT){
        validatedInput = MIN_NUMERIC_INPUT;
    }

    //Input becomes max if it's above the max
    else if(validatedInput > MAX_NUMERIC_INPUT){
        validatedInput = MAX_NUMERIC_INPUT;
    }

    return validatedInput;
}

function validateMineInput(mines, rows, cols){

    if(!mines || isNaN(mines)){
        return DEFAULT_NUMERIC_INPUT;
    }

    validatedMines = Number(mines);
    let unitCount = rows * cols;

    //Set the mine count to the minimum if the input was lower
    if(validatedMines < MIN_NUMERIC_INPUT){
        validatedMines = MIN_NUMERIC_INPUT;
    }

    //There can't be more mines then units
    else if(validatedMines > unitCount){
        validatedMines = unitCount;
    }

    return validatedMines;
}

function gameOver(units){

    //Loop over all units and reveal the bombs
    for(let y = 0; y < units.length; y++){
        for(let x = 0; x < units[y].length; x++){

            const unit = units[y][x];
            
            if(unit.isBomb){
                unit.instance.style.backgroundImage = "none";
                unit.isFlagged = false;
                unit.reveal();
            }
        }
    }
    gameStatus.textContent = "Game Over";
    donePlaying = true;
}

function checkForVictory(units){

    //Loop over all the units, and check for an unFlaggedBomb or unRevealedUnit
    for(let y = 0; y < units.length; y++){
        for(let x = 0; x < units[y].length; x++){

            const unit = units[y][x];
            const unFlaggedBomb = unit.isBomb && !unit.isFlagged;
            const unRevealedUnit  = !unit.isRevealed && !unit.isBomb;

            if( unFlaggedBomb || unRevealedUnit){
                return;
            }
        }
    }

    //If we reach this code, we've clearly won the game
    gameWon(units);
}

function gameWon(units){

    //Set all the revealed units to have a green background color
    for(y = 0; y < units.length; y++){
        for(x = 0; x < units[y].length; x++){

            const unit = units[y][x];
            
            if(unit.isRevealed){
                unit.instance.style.backgroundColor = victoryGreen;
            }
        }
    }
    gameStatus.textContent = "You won!";
    donePlaying = true;
}

function clearBoard(game){

    //Remove all the units from the board
    while(game.firstChild){
        game.removeChild(game.firstChild);
    }
}

function revealNeighbours(units, yIndex, xIndex){
    //Clamp the y value so we don't go below 0 or equal to rows
    const yStart = Math.max(0, yIndex-1);
    const yEnd = Math.min(units.length-1, yIndex+1);

    //Clamp the x value so we don't go below 0 or equal to cols
    const xStart = Math.max(0, xIndex-1);
    const xEnd = Math.min(units[yIndex].length-1, xIndex+1);

    for(let y = yStart; y <= yEnd; y++){
        for(let x = xStart; x <= xEnd; x++){
            const unit = units[y][x];
            if(!unit.isFlagged && !unit.isBomb && !unit.isRevealed){
                unit.reveal(units);
            }
        }
    }
}

function setNeighbourBombsValue(units, yIndex, xIndex){

    //Clamp the y value so we don't go below 0 or equal to rows
    const yStart = Math.max(0, yIndex-1);
    const yEnd = Math.min(units.length-1, yIndex+1);

    //Clamp the x value so we don't go below 0 or equal to cols
    const xStart = Math.max(0, xIndex-1);
    const xEnd = Math.min(units[yIndex].length-1, xIndex+1);
    
    //Go through the surrounding units and increment the bomb counter for every bomb found
    for(let y = yStart; y <= yEnd; y++){
        for(let x = xStart; x <= xEnd; x++){
            if(units[y][x].isBomb){
                //The unit we are checking increments it's counter for every neighbour bomb
                units[yIndex][xIndex].neighbourBombs++; 
            }
        }
    }
}

function decrementRemainingFlags(){
    flagsLeft--;

    if(flagsLeft <= 0){
        flagsLeft = 0;
    }

    flagStatus.textContent = "Flags left: " + String(flagsLeft);
}

function incrementRemainingFlags(){
    flagsLeft++;
    flagStatus.textContent = "Flags left: " + String(flagsLeft);
}

function resetGame(game, board){
    clearBoard(game);
    donePlaying = false;
    gameStatus.textContent = "Ongoing Game";
    flagsLeft = board.mines;
    flagStatus.style.display = "block";
    flagStatus.textContent = "Flags left: " + String(flagsLeft);
}

function checkForBomb(board, y, x){
    for(let i = 0; i < board.mines; i++){
        if(y === board.minePositions[i][0] && x === board.minePositions[i][1]){
            return true;   
        }
    }
    return false;
}

function createButton(width, height, backgroundColor){
    const instance = document.createElement("BUTTON");
    instance.style.width = String(width) + "px";
    instance.style.height = String(height) + "px";
    instance.style.backgroundColor = backgroundColor;
    return instance;
}

function onLeftClick(units, unit){
    if(unit.isRevealed || unit.isFlagged || donePlaying){
        return;
    }

    //We lose the game when we click on a bomb
    if(!unit.isFlagged && unit.isBomb){
        gameOver(units);
    }
    else{
        unit.reveal(units);
        checkForVictory(units);
    }
}

function onRightClick(event, units, unit){
    event.preventDefault(); //Prevent context menu pop up

    if(!donePlaying){
        unit.flag(); //Flag the selected unit
        checkForVictory(units);
    }
}

function instantiateBoard(board){

    //Create a 2D array to store the rows * cols grid
    const units = [...Array(board.rows)].map(element => Array(board.cols));
    
    for(let y = 0; y < board.rows; y++){
        for(let x = 0; x < board.cols; x++){

            //Check if the current unit is a bomb
            let isBomb = checkForBomb(board, y, x);

            //Create a button to act as an instance of our unit
            const instance = createButton(UNIT_WIDTH, UNIT_HEIGHT, unRevealedGray);

            const unit = new Unit(instance, y, x, isBomb);

            //Make unit react to a left click
            instance.addEventListener("click", () =>{
                onLeftClick(units, unit);
            });

            //Make unit react to a right click
            instance.addEventListener("contextmenu", (event) => {
                onRightClick(event, units, unit);
            });

            //Store all units in an array
            units[y][x] = unit;

            //Add the button to the website display
            game.appendChild(instance);
        }
    }
}

function renderBoard(board){
    const gameContainer = document.getElementById("game-container");

    //Set the width and height of the board according to the user input
    gameContainer.style.width = String(board.cols * UNIT_HEIGHT) + "px";
    gameContainer.style.height = String(board.rows * UNIT_WIDTH) + "px";

    //The object that's gonna hold all the units
    const game = document.getElementById("game");
    
    //Reset the game, just in case we haven't just opened the page
    resetGame(game, board);

    //Instantiate all the units on the board
    instantiateBoard(board, game);
}

function generateBoard(){

    //Get all the input data
    const rows = document.getElementById("rows");
    const cols = document.getElementById("cols");
    const mines = document.getElementById("mines");

    //Validate the input data
    validatedRows = validateGridInput(rows.value);
    validatedCols = validateGridInput(cols.value);
    validatedMines = validateMineInput(mines.value, validatedRows, validatedCols);

    //Show the user what the validated data becomes
    rows.value = validatedRows;
    cols.value = validatedCols;
    mines.value = validatedMines;

    const board = initializeBoard(validatedRows, validatedCols, validatedMines);
    renderBoard(board);
}

function initializeBoard(rows, cols, mines){

    const minePositions = [...Array(mines)].map(element => Array(2));

    for(let i = 0; i < mines; i++){
        placeMine(minePositions, cols, rows, i);
    }

    return {
        rows: rows,
        cols: cols,
        mines: mines,
        minePositions: minePositions
    }
}

function placeMine(minePositions, cols, rows, index){

    let minePos = [Math.floor(Math.random() * rows), Math.floor(Math.random() * cols)];

    while(arrayInArray(minePositions, minePos)){
        minePos = [Math.floor(Math.random() * rows), Math.floor(Math.random() * cols)];
    }
    minePositions[index] = minePos;
}

function arrayInArray(array1, array2){
    for(let i = 0; i < array1.length; i++){
        if(array1[i][0] === array2[0] && array1[i][1] === array2[1]){
            return true;  
        }
    }
    return false;
}