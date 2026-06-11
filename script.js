const apiKey = 'd168501ed50d0b52c15aef8e160483ee';
let currentUnit = 'metric'; // 'metric' or 'imperial'
let lastQuery = { type: 'city', value: 'Paris' };

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const geoBtn = document.getElementById('geo-btn');
const unitC = document.getElementById('unit-c');
const unitF = document.getElementById('unit-f');
const errorBanner = document.getElementById('error-banner');
const errorMessage = document.getElementById('error-message');
const recentSearchesContainer = document.getElementById('recent-searches');

const tempEl = document.getElementById('temp');
const descEl = document.getElementById('desc');
const locationEl = document.getElementById('location-name');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const feelsLikeEl = document.getElementById('feels-like');
const pressureEl = document.getElementById('pressure');
const visibilityEl = document.getElementById('visibility');
const sunCycleEl = document.getElementById('sun-cycle');
const iconContainer = document.getElementById('weather-icon-container');

const bgLayer1 = document.getElementById('bg-layer-1');
const bgLayer2 = document.getElementById('bg-layer-2');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadRecentSearches();
    checkWeather('Paris');
    setupEventListeners();
});

// --- Event Listeners Setup ---
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') handleSearch();
    });

    geoBtn.addEventListener('click', handleGeolocation);

    unitC.addEventListener('click', () => setUnit('metric'));
    unitF.addEventListener('click', () => setUnit('imperial'));
}

// --- Search Handler ---
function handleSearch() {
    const city = cityInput.value.trim();
    if (city !== "") {
        checkWeather(city);
    }
}

// --- Geolocation Handler ---
function handleGeolocation() {
    if (navigator.geolocation) {
        geoBtn.classList.add('loading');
        // Show active state/feedback
        geoBtn.style.color = '#38bdf8';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                checkWeatherByCoords(latitude, longitude);
                geoBtn.style.color = '';
            },
            (error) => {
                console.error("Geolocation error:", error);
                showError("Location access denied. Please search manually.");
                geoBtn.style.color = '';
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
}

// --- Unit Management ---
function setUnit(unit) {
    if (currentUnit === unit) return;
    currentUnit = unit;

    if (unit === 'metric') {
        unitC.classList.add('active');
        unitF.classList.remove('active');
    } else {
        unitF.classList.add('active');
        unitC.classList.remove('active');
    }

    // Refresh weather with new units
    if (lastQuery.type === 'city') {
        checkWeather(lastQuery.value);
    } else if (lastQuery.type === 'coords') {
        checkWeatherByCoords(lastQuery.value.lat, lastQuery.value.lon);
    }
}

// --- Fetch Weather Logic ---
async function checkWeather(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${currentUnit}`;
    lastQuery = { type: 'city', value: city };
    await fetchWeatherData(apiUrl);
}

async function checkWeatherByCoords(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}`;
    lastQuery = { type: 'coords', value: { lat, lon } };
    await fetchWeatherData(apiUrl);
}

async function fetchWeatherData(apiUrl) {
    try {
        // Reset Error Banner
        errorBanner.style.display = 'none';

        const response = await fetch(apiUrl);
        if (!response.ok) {
            if (response.status === 404) {
                showError("City not found. Please double check the spelling.");
            } else {
                showError("Something went wrong. Please try again later.");
            }
            return;
        }

        const data = await response.json();
        updateUI(data);
        saveRecentSearch(data.name);

    } catch (error) {
        console.error("API Error:", error);
        showError("Network connection error. Check your internet connection.");
    }
}

// --- UI Rendering ---
function updateUI(data) {
    // 1. Core info
    const isMetric = currentUnit === 'metric';
    const tempUnitSign = isMetric ? '°C' : '°F';
    
    tempEl.textContent = `${Math.round(data.main.temp)}${tempUnitSign}`;
    descEl.textContent = data.weather[0].description;
    
    // Set City and Country
    locationEl.querySelector('span').textContent = `${data.name}, ${data.sys.country}`;
    cityInput.value = data.name;

    // 2. Metrics Grid
    feelsLikeEl.textContent = `${Math.round(data.main.feels_like)}°`;
    humidityEl.textContent = `${data.main.humidity}%`;
    
    // Wind Speed conversion (Metric API returns meters/sec, Imperial returns miles/hour)
    if (isMetric) {
        const windKmh = Math.round(data.wind.speed * 3.6);
        windEl.textContent = `${windKmh} km/h`;
    } else {
        windEl.textContent = `${Math.round(data.wind.speed)} mph`;
    }

    pressureEl.textContent = `${data.main.pressure} hPa`;
    
    // Visibility conversion (OpenWeatherMap returns meters regardless of unit)
    const visibilityKm = (data.visibility / 1000).toFixed(1);
    if (isMetric) {
        visibilityEl.textContent = `${visibilityKm} km`;
    } else {
        const visibilityMi = (data.visibility / 1609.34).toFixed(1);
        visibilityEl.textContent = `${visibilityMi} mi`;
    }

    // Sunrise & Sunset Formatting (Destination local time)
    const sunriseStr = formatLocalTime(data.sys.sunrise, data.timezone);
    const sunsetStr = formatLocalTime(data.sys.sunset, data.timezone);
    sunCycleEl.textContent = `${sunriseStr} / ${sunsetStr}`;

    // 3. Update Weather Icon and Background
    const weatherCondition = data.weather[0].main;
    const isNight = data.dt < data.sys.sunrise || data.dt > data.sys.sunset;
    
    updateWeatherIcon(weatherCondition, isNight);
    updateBackgroundTheme(data.name, weatherCondition, isNight);
}

// --- Helper: Local Time Formatter ---
function formatLocalTime(timestamp, timezoneOffset) {
    // OpenWeatherMap timezone offset is in seconds from UTC.
    // We add this to get the exact destination local UTC time.
    const date = new Date((timestamp + timezoneOffset) * 1000);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

// --- Helper: Dynamic Icon Renderer ---
function updateWeatherIcon(weatherCondition, isNight) {
    let iconHTML = '';
    const cond = weatherCondition.toLowerCase();

    if (cond === 'clear') {
        iconHTML = isNight 
            ? '<i class="fa-solid fa-moon" style="color: #cbd5e1;"></i>' 
            : '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>';
    } else if (cond === 'clouds') {
        iconHTML = isNight 
            ? '<i class="fa-solid fa-cloud-moon" style="color: #94a3b8;"></i>' 
            : '<i class="fa-solid fa-cloud-sun" style="color: #e2e8f0;"></i>';
    } else if (['rain', 'drizzle'].includes(cond)) {
        iconHTML = '<i class="fa-solid fa-cloud-showers-heavy" style="color: #38bdf8;"></i>';
    } else if (cond === 'thunderstorm') {
        iconHTML = '<i class="fa-solid fa-cloud-bolt" style="color: #a855f7;"></i>';
    } else if (cond === 'snow') {
        iconHTML = '<i class="fa-solid fa-snowflake" style="color: #bae6fd;"></i>';
    } else if (['mist', 'smoke', 'haze', 'dust', 'fog', 'sand', 'ash', 'squall', 'tornado'].includes(cond)) {
        iconHTML = '<i class="fa-solid fa-smog" style="color: #cbd5e1;"></i>';
    } else {
        iconHTML = '<i class="fa-solid fa-cloud" style="color: #cbd5e1;"></i>';
    }

    iconContainer.innerHTML = iconHTML;
}

// --- Helper: Dynamic Background Theme Cross-fade ---
function updateBackgroundTheme(city, weatherCondition, isNight) {
    let themeClass = 'theme-default';
    let queryTags = [];
    
    // 1. Determine fallback theme class
    const cond = weatherCondition.toLowerCase();
    if (isNight) {
        themeClass = 'theme-night';
        queryTags.push('night');
    } else {
        if (cond === 'clear') {
            themeClass = 'theme-clear';
            queryTags.push('sunny');
        } else if (cond === 'clouds') {
            themeClass = 'theme-clouds';
            queryTags.push('cloudy');
        } else if (['rain', 'drizzle'].includes(cond)) {
            themeClass = 'theme-rain';
            queryTags.push('rainy');
        } else if (cond === 'thunderstorm') {
            themeClass = 'theme-thunder';
            queryTags.push('storm');
        } else if (cond === 'snow') {
            themeClass = 'theme-snow';
            queryTags.push('snowy');
        } else if (['mist', 'smoke', 'haze', 'dust', 'fog', 'sand', 'ash', 'squall', 'tornado'].includes(cond)) {
            themeClass = 'theme-mist';
            queryTags.push('foggy');
        } else {
            queryTags.push('weather');
        }
    }

    // 2. Add clean city name to tags if present
    if (city) {
        const cleanCity = city.split(',')[0].trim().toLowerCase();
        queryTags.unshift(cleanCity); // place city name as primary keyword
    }

    // 3. Build dynamic search URL
    const tagString = queryTags.join(',');
    const imageUrl = `https://loremflickr.com/1920/1080/${tagString}`;

    // Determine active and inactive background layers
    const activeLayer = bgLayer1.classList.contains('active') ? bgLayer1 : bgLayer2;
    const inactiveLayer = activeLayer === bgLayer1 ? bgLayer2 : bgLayer1;

    // Reset background-image property to let theme fallback gradients take over if loading
    inactiveLayer.className = 'bg-transition';

    // Preload the photorealistic dynamic location-specific image
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
        // Apply the loaded image on top of fallback theme classes
        inactiveLayer.style.backgroundImage = `url('${imageUrl}')`;
        inactiveLayer.classList.add(themeClass);
        
        // Trigger transition cross-fade
        inactiveLayer.classList.add('active');
        activeLayer.classList.remove('active');
    };
    
    img.onerror = () => {
        // Fallback to static gradient theme if image download fails
        inactiveLayer.style.backgroundImage = '';
        inactiveLayer.classList.add(themeClass);
        inactiveLayer.classList.add('active');
        activeLayer.classList.remove('active');
    };
}

// --- Local Storage Search History ---
function saveRecentSearch(city) {
    if (!city) return;
    
    let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    
    // Remove if exists to place it at the front of the list
    searches = searches.filter(item => item.toLowerCase() !== city.toLowerCase());
    searches.unshift(city);
    
    // Keep max 5 items
    searches = searches.slice(0, 5);
    
    localStorage.setItem('recentSearches', JSON.stringify(searches));
    renderRecentSearches(searches);
}

function loadRecentSearches() {
    const searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    renderRecentSearches(searches);
}

function renderRecentSearches(searches) {
    recentSearchesContainer.innerHTML = '';
    
    if (searches.length === 0) {
        recentSearchesContainer.style.display = 'none';
        return;
    }
    
    recentSearchesContainer.style.display = 'flex';
    
    searches.forEach(city => {
        const chip = document.createElement('div');
        chip.className = 'recent-chip';
        chip.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${city}`;
        chip.addEventListener('click', () => {
            checkWeather(city);
        });
        recentSearchesContainer.appendChild(chip);
    });
}

// --- Error Banner controller ---
function showError(message) {
    errorMessage.textContent = message;
    errorBanner.style.display = 'flex';
    
    // Reset any previous animation and trigger shake
    errorBanner.style.animation = 'none';
    setTimeout(() => {
        errorBanner.style.animation = 'shake 0.5s ease-in-out';
    }, 10);
}
