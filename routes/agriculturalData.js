const express = require("express");
const axios = require("axios");
const router = express.Router();

const OPENWEATHER_API_KEY = "a1261fdbd807312e84b79a61ca2ca284"; // Replace with your OpenWeatherMap API Key

// Function to fetch air quality data
const fetchAirQuality = async (lat, lon) => {
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
  const response = await axios.get(url);
  return response.data;
};

// Function to fetch soil moisture (NASA Soil Moisture API)
const fetchSoilMoisture = async (lat, lon) => {
  return {
    soilMoisture: (Math.random() * (40 - 10) + 10).toFixed(2), // Mock data since real API needs authentication
    soilTemperature: (Math.random() * (35 - 15) + 15).toFixed(2),
  };
};

// Function to get crop recommendations
const getCropRecommendation = (temperature, humidity) => {
  if (temperature > 30) return "Best crops: Maize, Cotton, Sorghum 🌽";
  if (temperature > 20) return "Best crops: Wheat, Barley, Peas 🌾";
  return "Best crops: Potato, Cabbage, Broccoli 🥔";
};

// API Route to fetch agricultural insights
router.get("/agriculture-data", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and Longitude are required" });
    }

    // Fetch additional data
    const airQualityData = await fetchAirQuality(lat, lon);
    const soilData = await fetchSoilMoisture(lat, lon);
    
    // Generate crop recommendation based on soil temperature & humidity
    const cropRecommendation = getCropRecommendation(soilData.soilTemperature, airQualityData.list[0].main.humidity);

    res.json({
      airQuality: airQualityData.list[0].main.aqi,
      soilMoisture: soilData.soilMoisture,
      soilTemperature: soilData.soilTemperature,
      cropRecommendation,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch agricultural data" });
  }
});

module.exports = router;
