'use strict';


const carsList = [];
const searchResult = document.querySelector('#searchResult');//gets the form of search result, use it to hide/unhide later (hidden by default)
const addCarForm = document.querySelector('#addCarForm')//get form with all inputs to add a car
const searchCarForm = document.querySelector('#searchCarForm')//get form with car search

//this function validates that user have inputed only allowed symbols
function validateForm(input) {
    return /^[a-zA-Z0-9- ]+$/.test(input);
}

//create Car prototype
class Car {
    constructor(licensePlate, maker, model, year, currentOwner, price, discountedPrice, color) {
        this.licensePlate = licensePlate.toUpperCase();
        this.maker = maker;
        this.model = model;
        this.year = year;
        this.currentOwner = currentOwner;
        this.price = parseFloat(price);
        this.discountedPrice = discountedPrice;
        this.color = color;
    }
}

const displayMessage = (message, type = "success") => {//success by default (if not defined in the function). 
    const messageElement = document.querySelector("#message"); //get div, which appears after any operation to confirm the result
    messageElement.textContent = message;
    messageElement.className = type;
    setTimeout(() => {
        messageElement.textContent = "";
        messageElement.className = "";
    }, 3000);//in 3sec the message dissapears
};

function discountPrice(price) {
    const DISCOUNT_RATE = 0.85;
    return (price * DISCOUNT_RATE).toFixed(2);
}

//this function takes user's input and creates a new object with Car prototype and saves it in local storage
function addCar(event) {
    event.preventDefault();//do not drop the table on submit

    const licensePlate = document.querySelector('#licensePlate').value.trim();
    const maker = document.querySelector('#maker').value.trim();
    const model = document.querySelector('#model').value.trim();
    const year = document.querySelector('#year').value.trim();


    const currentOwner = document.querySelector('#currentOwner').value.trim();
    const price = document.querySelector('#price').value.trim();
    let discountedPrice = "-";//no discount by default
    const color = document.querySelector('#color').value.trim();

    console.log(`Added new car: ${licensePlate}, ${maker}, ${model}, ${year}, ${currentOwner}, ${price}, ${discountedPrice}, ${color}`);

    //Error Handling for Input Validation
    try {
        if (licensePlate === "") {//license plate field can't be empty
            throw new Error("You forgot to fill the License plate field");
        }
        if (!validateForm(licensePlate)) {//license plate can contain only latin letters, figures hyphens and spaces 
            throw new Error("You can only enter either 0-9, A-F, '-' and spaces");
        }
        if (carsList.some((car) => car.licensePlate === licensePlate.toUpperCase())) { //license plate must be unique
            throw new Error("Looks like this car is already in the base (same license plate found)");
        }
        if (+price < 0) {//price must be a positive number
            console.log(typeof price);
            throw new Error("Price must be a positive number");
        }
        if (+year < 1886 && +year !== 0) {//year of production can't be earlier than the first car in history. Empty field doesn't equal 0.
            console.log("Emmett,stop with this nonsense");
            throw new Error("The first car was made in 1886. Make sure that you put down the right year");
        }
        if (year > new Date().getFullYear()) {//a car can't be produced in the future
            console.log(typeof year);
            console.log(`
                User inserted ${year} year. \n
                Emmett, be a reasonable man...
                `);
            throw new Error(`It's ${new Date().getFullYear()} now. Make sure that you put down the right year.\n
            In a case of some time-space events grab your towel and don't panic!`);
        }
        if (year !== "" && new Date().getFullYear() - +year > 10) { //cars that are older than 10 years should receive a 15% discount on their price
            discountedPrice = discountPrice(price);
        }

        const newCar = new Car(licensePlate, maker, model, year, currentOwner, price, discountedPrice, color); //create new object
        carsList.push(newCar); //push the object to carList array

        localStorage.setItem('carsList', JSON.stringify(carsList));//store carsList in localStorage as JSON

        //createTable(newCar);//evoke function whick takes the newCar and inserts it to the table's fields
        displayMessage("Car added successfully!");
        createTable();


    } catch (error) {
        displayMessage(error.message, "error");
    } finally {
        console.log('License plate check was executed');
    }
    searchResult.classList.add('hidden');//hide search result div
}

//this function creates the table using localStorage. We use it onload for the entire page.
const loadCarsFromLocalStorage = () => {
    const storedCars = localStorage.getItem('carsList');
    if (storedCars) {
        const parsedCars = JSON.parse(storedCars);
        parsedCars.forEach(carData => {
            carsList.push(new Car(carData.licensePlate.toUpperCase(), carData.maker, carData.model, carData.year, carData.currentOwner, carData.price, carData.discountedPrice, carData.color));
        });
        createTable();
    }
};

//this function uses cars array to create the table
function createTable() {
    let table = document.querySelector('#carsTable');//get the table

    // Clear existing rows except for the header (first row)
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Create a row for each car
    carsList.forEach((car, index) => {
        let row = table.insertRow(-1);
        const values = [car.licensePlate, car.maker, car.model, car.year, car.currentOwner, car.price.toFixed(2), car.discountedPrice, car.color];

        values.forEach((value, i) => {
            let cell = row.insertCell(i);
            cell.innerText = value ?? 'N/A'; //in case of some frontend fail field receives "N/A value". In general these fields are required, so they can't be N/A.

            if (value === values.at(-1)) { //it's the last cell it a row
                // Check the color's luminance to adjust text color. Here I use an external library "tinycolor" to get a value of how bright the collor is. And use it to switch font collor between black and white.
                cell.style.backgroundColor = car.color;// use the cars color to the cell
                if (tinycolor(car.color).getLuminance() < 0.5) {
                    cell.style.color = '#FFFFFF';//use white font if the color is dark
                } else {
                    cell.style.color = '#000';//use black font if the color is light
                }
            }
        });
        //creates "delete" button in the last field of the table. This button calls deleteCar function.
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete");
        deleteButton.addEventListener("click", () => deleteCar(index));
        row.insertCell(-1).appendChild(deleteButton);
    });
}

//deletes a car from the array using it's index.
const deleteCar = (index) => {
    carsList.splice(index, 1);
    localStorage.setItem('carsList', JSON.stringify(carsList));
    createTable();
    displayMessage("Car deleted successfully!");
};

//this function filters through the array and and returns the object keys by license plate match
function searchCar(event) {
    event.preventDefault();//do not drop the table on submit
    let foundCar = document.querySelector('#foundCar');
    let licensePlateSearch = document.querySelector('#licensePlateSearch').value.toUpperCase().trim();

    try {
        if (licensePlateSearch === "") {
            throw new Error("You forgot to fill the search field");
        }
        if (!validateForm(licensePlateSearch)) {
            throw new Error("You can only enter either 0-9, A-F, '-' and spaces");
        }
        searchResult.classList.remove('hidden');//unhide search results div

        const filtered = carsList.filter((element) => element.licensePlate === licensePlateSearch);

        //if the length is more than 0, than apparently if has found something. Than return the keys of this object
        if (filtered.length > 0) {
            foundCar.innerText = `
                    I found a car: \n
                    licence plate: ${filtered[0].licensePlate}\n
                    maker: ${filtered[0].maker}\n
                    model: ${filtered[0].model}\n
                    year: ${filtered[0].year}\n
                    current owner: ${filtered[0].currentOwner}\n
                    price: ${filtered[0].price}\n
                    discounted price: ${filtered[0].discountedPrice}\n
                    color: ${filtered[0].color}`;
        } else {
            foundCar.innerText = "nothing found";
        }
    }
    catch (error) {
        alert(`${error}`);
    } finally {
        console.log('License plate check was executed');
    }
}

function themeToogle() {
    let pagesBody = document.body;
    pagesBody.classList.toggle("dark-mode");
}

//get current year for copyright in the footer:
document.getElementById("thisYear").innerText = new Date().getFullYear();

addCarForm.addEventListener('submit', addCar);
searchCarForm.addEventListener('submit', searchCar);
window.addEventListener('load', loadCarsFromLocalStorage);
document.querySelector('#themeToogle').addEventListener('click', themeToogle);