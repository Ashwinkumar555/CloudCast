// Weather App JS - CloudCast
// Replace 'YOUR_API_KEY' with your OpenWeatherMap API key
const API_KEY = '324e8d3b93a91cf1a86649c540a906cb';

const citySearchForm = document.getElementById('citySearchForm');
const cityInput = document.getElementById('cityInput');

// DOM elements for updating
const tempElem = document.querySelector('.temp');
const descElem = document.querySelector('.desc');
const locationElem = document.querySelector('.location');
const weatherIconElem = document.querySelector('.weather-icon');
const windElem = document.querySelector('.current-details div:nth-child(1) span');
const rainElem = document.querySelector('.current-details div:nth-child(2) span');
const humidityElem = document.querySelector('.current-details div:nth-child(3) span');
const hourlyScroll = document.querySelector('.hourly-scroll');
const dailyList = document.querySelector('.daily-list');

// Chart.js instance
let tempChart;

citySearchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  fetchWeather(city);
});

async function fetchWeather(city) {
  try {
    // Get coordinates
    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`);
    const geoData = await geoRes.json();
    if (!geoData[0]) {
      alert('City not found!');
      return;
    }
    const { lat, lon, name, country } = geoData[0];

    // Get weather data
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${API_KEY}`);
    const weatherData = await weatherRes.json();
    updateCurrentWeather(weatherData.current, name, country);
    updateHourly(weatherData.hourly);
    updateDaily(weatherData.daily);
    updateChart(weatherData.hourly);
  } catch (err) {
    alert('Failed to fetch weather data.');
  }
}

function updateCurrentWeather(current, city, country) {
  tempElem.textContent = Math.round(current.temp) + '°C';
  descElem.textContent = capitalize(current.weather[0].description);
  locationElem.textContent = `${city}, ${country}`;
  weatherIconElem.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;
  windElem.textContent = Math.round(current.wind_speed) + ' km/h';
  rainElem.textContent = (current.rain ? current.rain['1h'] : 0) + '%';
  humidityElem.textContent = current.humidity + '%';
}

function updateHourly(hourly) {
  hourlyScroll.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const hour = hourly[i];
    const date = new Date(hour.dt * 1000);
    const hourStr = date.getHours() % 12 || 12;
    const ampm = date.getHours() < 12 ? 'AM' : 'PM';
    const item = document.createElement('div');
    item.className = 'hourly-item';
    item.innerHTML = `
      <span class="hour">${hourStr} ${ampm}</span>
      <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" alt="${hour.weather[0].main}">
      <span class="hour-temp">${Math.round(hour.temp)}°C</span>
    `;
    hourlyScroll.appendChild(item);
  }
}

function updateDaily(daily) {
  dailyList.innerHTML = '';
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (let i = 0; i < 7; i++) {
    const day = daily[i];
    const date = new Date(day.dt * 1000);
    const dayStr = days[date.getDay()];
    const item = document.createElement('div');
    item.className = 'daily-item';
    item.innerHTML = `
      <span class="day">${dayStr}</span>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].main}">
      <span class="day-temp">${Math.round(day.temp.day)}°C</span>
    `;
    dailyList.appendChild(item);
  }
}

function updateChart(hourly) {
  const ctx = document.getElementById('tempChart').getContext('2d');
  const labels = hourly.slice(0, 8).map(h => {
    const d = new Date(h.dt * 1000);
    return (d.getHours() % 12 || 12) + (d.getHours() < 12 ? 'AM' : 'PM');
  });
  const temps = hourly.slice(0, 8).map(h => h.temp);
  if (tempChart) tempChart.destroy();
  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temp (°C)',
        data: temps,
        borderColor: '#4f8ef7',
        backgroundColor: 'rgba(79,142,247,0.15)',
        tension: 0.4,
        pointRadius: 3,
        fill: true,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#e3f0ff' }, beginAtZero: false }
      },
      responsive: true,
      maintainAspectRatio: false,
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
