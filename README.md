# 🏃‍♂️ SmartRunSense: IoT-Based Environmental Monitoring and Prediction System 

<p align="center">
  <img src="https://img.shields.io/badge/c++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white" alt="C++">
  <img src="https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" alt="Python">
  <img src="https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="scikit-learn">
  <img src="https://img.shields.io/badge/GoogleCloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Google Cloud">
  <img src="https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/espressif-E7352C.svg?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32">
</p>

## 📖 Overview
Outdoor running provides cardiovascular and mental health benefits, but exposes runners to thermodynamic and respiratory stresses caused by environmental conditions like heat, humidity, particulate matter, and gaseous pollutants. SmartRunSense is an Internet of Things (IoT) system designed to optimize performance and reduce physiological risks by helping runners make informed decisions about when and where to train. 

The system combines real-time environmental sensing, cloud-based data storage, machine learning predictive analytics, and a companion mobile application to provide both current and forecasted environmental conditions. 

---

## 🗺️ System Architecture Diagram
The diagram below illustrates the comprehensive project structure and data connections, organizing the system into four distinct logical layers: Edge Hardware (Wearable and Smart Pole nodes with their shared sensor suite), Cloud Ingestion & Storage (Firestore acting as the central data hub), Cloud Processing (Google Cloud Run executing the scikit-learn Random Forest forecasting engine), and the Application Layer (Mobile App visualizing live and forecasted conditions).

<p align="center">
  <img src="screenshots/system_architecture.png" width="900" alt="SmartRunSense System Architecture Diagram">
</p>

---

## ✨ Key Features
* 📡 **Real-Time Monitoring:** Collects localized environmental data using wearable devices and stationary "Smart Poles".
* 🤖 **Machine Learning Forecasting:** Automatically predicts air quality and weather conditions 7 days into the future.
* 📱 **Mobile Application:** Provides a live sensor dashboards, historical analytics, and a "Smart Schedule" to plan the safest times to jog.

---

## 🛠️ Hardware Architecture

The system utilizes a dual-node hardware approach, consisting of mobile wearable devices and stationary monitoring nodes ("Smart Poles"). 

## ⌚ 1. Wearable Device
Designed for mobility, this node can be built using either an **ESP32 DevKitC** or a compact **ESP32-C3 Super Mini** microcontroller. 

<p align="center">
  <img src="screenshots/wearable_schematic_1.png" height="250" alt="Wearable Schematic (Board-01)">
  &nbsp;
  <img src="screenshots/wearable_schematic_2.png" height="250" alt="Wearable Schematic (Board-02)">
  &nbsp;
  <img src="screenshots/wearable_pcb_3D_1.png" height="250" alt="Wearable PCB 3D View (Board-01)">
  &nbsp;
  <img src="screenshots/wearable_pcb_3D_2.png" height="250" alt="Wearable PCB 3D View (Board-02)">
  &nbsp;
  <img src="screenshots/wearable.jpeg" height="250" alt="Assembled Wearable Device">
  &nbsp;
  <img src="screenshots/wearable_pcb.jpeg" height="250" alt="Wearable PCB Layout"> 
</p>

---

## 🗼 2. Smart Pole (Stationary Node)
Designed for continuous environmental monitoring at fixed locations (like running tracks or parks), this node is powered by a more robust **ESP32-S3** module.

<p align="center">
  <img src="screenshots/pole_pcb_schemetic.png" height="250" alt="Smart Pole Schematic">
  &nbsp;
  <img src="screenshots/pole_pcb_3d.png" height="250" alt="Smart Pole 3D PCB View">
  &nbsp;
  <img src="screenshots/pole.jpeg" height="250" alt="Assembled Smart Pole Device">
  &nbsp;
  <img src="screenshots/pole_pcb.jpeg" height="250" alt="Smart Pole PCB Layout">
</p>

---

Both the wearable and the Smart Pole devices interface with the following shared sensor suite and components:

## 🌡️ Sensors
* 🌬️ **ENS160 (Air Quality):** A self-calibrated digital sensor that measures the Air Quality Index (AQI), eCO2 (400-65,000 ppm), and Total Volatile Organic Compounds (TVOC).
* 💧 **AHT21 (Temperature & Humidity):** Factory-calibrated sensor measuring temperature (-40°C to +85°C) and relative humidity.
* 🏭 **MQ135 Gas Sensor:** An analog chemoresistive sensor used to measure general gas pollution intensity (0-100% scale), including Ammonia, NOx, Alcohol, Benzene, and Smoke. It uses a voltage divider circuit to safely interface the 5V sensor with the 3.3V ESP32.
* 💨 **SHARP GP2Y1010 Dust Sensor:** An optical sensor with an internal infrared LED and photodiode used to detect fine particles like dust, pollen, and smoke.

---

## 🧠 Machine Learning Forecasting Engine & ☁️ Cloud Infrastructure
A Python-based Cloud Run microservice acts as the forecasting engine.

* ⚙️ **Execution:** Triggered every 30 minutes by Google Cloud Scheduler.
<p align="center">
  <img src="screenshots/cloud_scheduler.png" width="700" alt="Google Cloud Scheduler Configuration">
</p>

* 📈 **Algorithm:** Uses a Random Forest Regressor (via scikit-learn) because it efficiently handles the highly non-linear nature of environmental data and trains in seconds using standard CPUs without requiring strict data scaling.
<p align="center">
  <img src="screenshots/random_forest.png" width="500" alt="Random Forest Algorithm Architecture">
</p>

* 📊 **Data Scope:** The model queries the last 14 days (~20,000 readings) of data from Firestore to learn daily and weekly patterns.

* 🔮 **Output:** Generates predictions in 30-minute intervals for exactly 7 days into the future (336 distinct prediction steps per run). It predicts 7 variables simultaneously: Temperature, Humidity, Dust Density, AQI, TVOC, CO2, and Gas Pollution Percentage.

---

## 🗄️ Database
* 🔥 **Google Firestore:** Acts as the primary database, storing real-time sensor readings (e.g., timestamps, dust, eco2, tvoc, gas_pollution_percent, temperature, humidity) and the ML-generated predictions.
  
<p align="center">
  <img src="screenshots/firestore.png" width="700" alt="Google Firestore Database View">
</p>

---

## 📱 Mobile Application
The mobile UI provides comprehensive data visualization for the end-user:

* 📊 **Live Monitor:** Displays real-time metrics including a summarized "Run Score" (e.g., 77% - LOW RISK) and individual sensor percentages.
* 📅 **Plan Your Activity (Smart Schedule):** Allows users to view upcoming days and flags specific time slots (e.g., "21:00 Caution Required - Pollution or heat levels elevated") to help them plan the best time to run.
* 📉 **Analytics:** Visualizes historical trends and insights, such as Dust and CO2 levels over time.
* 🌤️ **Forecast:** Displays the upcoming environmental predictions generated by the cloud microservice.

## 📸 App Screenshots

<p align="center">
  <img src="screenshots/home_page.jpeg" width="180" alt="Home Page">
  &nbsp;
  <img src="screenshots/monitor_page.jpeg" width="180" alt="Live Monitor">
  &nbsp;
  <img src="screenshots/schedule_page.jpeg" width="180" alt="Smart Schedule">
  &nbsp;
  <img src="screenshots/analytics_page_1.jpeg" width="180" alt="Analytics Part 1">
  &nbsp;
  <img src="screenshots/analytics_page_2.jpeg" width="180" alt="Analytics Part 2">
</p>
