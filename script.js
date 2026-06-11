// 1. Setup your API credentials and UI element selectors
const apiKey = 'd168501ed50d0b52c15aef8e160483ee';
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');

const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const locationEl = document.getElementById('location-name');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const iconContainer = document.getElementById('weather-icon-container');

// 2. Core Function: Fetch Weather Data from API
async function checkWeather(city) {
    // We use units=metric to get Celsius. Change to units=imperial for Fahrenheit.
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            alert("City not found! Please check the spelling.");
            return;
        }

        const data = await response.json();
        console.log(data); // Perfect for checking the data structure in your browser console

        // 3. Update the HTML UI with the Live Data
        locationEl.textContent = `${data.name}, ${data.sys.country}`;
        tempEl.textContent = `${Math.round(data.main.temp)}°C`;
        descEl.textContent = data.weather[0].description;
        humidityEl.textContent = `${data.main.humidity}%`;
        windEl.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Converts m/s to km/h

        // 4. Dynamically Update Weather Icons based on API Response
        updateWeatherIcon(data.weather[0].main);

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// 5. Helper Function: Map API weather types to FontAwesome classes
function updateWeatherIcon(weatherCondition) {
    let iconHTML = '';

    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            iconHTML = '<i class="fa-solid fa-sun"></i>';
            break;
        case 'clouds':
            iconHTML = '<i class="fa-solid fa-cloud"></i>';
            break;
        case 'rain':
        case 'drizzle':
            iconHTML = '<i class="fa-solid fa-cloud-showers-heavy"></i>';
            break;
        case 'thunderstorm':
            iconHTML = '<i class="fa-solid fa-cloud-bolt"></i>';
            break;
        case 'snow':
            iconHTML = '<i class="fa-solid fa-snowflake"></i>';
            break;
        default:
            iconHTML = '<i class="fa-solid fa-cloud-sun"></i>'; // Fallback icon
    }

    iconContainer.innerHTML = iconHTML;
}

// 6. Event Listeners: Trigger search on click or pressing "Enter"
searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== "") {
        checkWeather(cityInput.value);
    }
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && cityInput.value.trim() !== "") {
        checkWeather(cityInput.value);
    }
});

// 7. Initialize app with a default city on page load
checkWeather('Paris');