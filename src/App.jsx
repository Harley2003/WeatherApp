/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import debounce from "lodash.debounce";
import {
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Filler,
  Tooltip,
} from "chart.js";

const ENDPOINT = "https://api.weatherapi.com/v1/forecast.json";
const APIKEY = "f5ac4be4a19c47d8a3e42522222112";

const App = () => {
  const [city, setCity] = useState("Hà Nội");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState("temp");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [apiCalled, setApiCalled] = useState(false); // Biến theo dõi việc gọi API

  const fetchWeatherData = async (city) => {
    setLoading(true);
    setError(null); // Reset error before fetching
    try {
      const response = await axios.get(
        `${ENDPOINT}?key=${APIKEY}&q=${city}&days=10&aqi=no&alerts=yes`
      );

      if (!response.data || !response.data.location) {
        throw new Error("City not found");
      }

      setWeather(response.data);
      setApiCalled(true); // Đánh dấu là đã gọi API thành công
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setError("Không tìm thấy thành phố. Quay về Hà Nội.");
      if (!apiCalled) {
        setCity("Hà Nội"); // Quay về Hà Nội khi có lỗi
        await fetchWeatherData("Hà Nội"); // Gọi lại API với Hà Nội
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherDebounced = useRef(
    debounce((newCity) => {
      if (newCity.trim()) {
        fetchWeatherData(newCity);
      } else {
        fetchWeatherData("Hà Nội");
      }
    }, 1000)
  ).current;

  useEffect(() => {
    fetchWeatherDebounced(city);
  }, [city]);

  const updateCurrentWeather = async (selectedDate) => {
    const dataDate = weather?.forecast?.forecastday?.find(
      (item) => item.date === selectedDate
    );

    if (dataDate) {
      setWeather((prev) => ({
        ...prev,
        current: {
          ...prev.current,
          temp_f: dataDate.day.avgtemp_f,
          condition: dataDate.day.condition,
        },
      }));
    }
  };

  const LineChart = ({ city, date, type }) => {
    const [dayData, setDayData] = useState([]);

    useEffect(() => {
      if (!weather) return;

      const dataDate = weather.forecast.forecastday.find(
        (item) => item.date === date
      );

      const dataMap = {
        temp: "temp_f",
        uv: "uv",
        humidity: "humidity",
      };

      if (dataDate) {
        const filteredData = dataDate.hour.map((item) => ({
          time: item.time,
          data: item[dataMap[type]],
        }));
        setDayData(filteredData);
      }
    }, [weather, date, type]);

    Chart.register(
      CategoryScale,
      LinearScale,
      LineElement,
      PointElement,
      Title,
      Tooltip,
      Legend,
      Filler
    );

    const labels = dayData.map((item) => item.time);
    const dt = dayData.map((item) => item.data);

    const data = {
      labels: labels,
      datasets: [
        {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          data: dt,
          fill: true,
          borderColor:
            type === "temp"
              ? "rgb(75, 192, 192)"
              : type === "uv"
              ? "rgb(227, 191, 12)"
              : "rgb(64, 136, 4)",
          borderWidth: 1,
          pointRadius: 0,
          backgroundColor:
            type === "temp"
              ? "rgba(5, 86, 86, 0.2)"
              : type === "uv"
              ? "rgb(241, 223, 137)"
              : "rgba(185, 235, 143, 0.2)",
          tension: 0.7,
        },
      ],
    };

    const options = {
      responsive: true,
      scales: {
        x: { display: false },
        y: { display: false },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return `${tooltipItem.raw} ${
                type === "temp" ? "°F" : type === "uv" ? "" : "%"
              }`;
            },
          },
        },
      },
    };

    return <Line data={data} options={options} />;
  };

  const handleCityChange = (e) => {
    setCity(e.target.value);
    setApiCalled(false); // Reset biến gọi API khi người dùng nhập vào
  };

  const handleChangeType = (e) => {
    setType(e.target.value);
  };

  const handleDateClick = (clickedDate) => {
    setDate(clickedDate);
    updateCurrentWeather(clickedDate);
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p className="text-red-500">{error}</p>; // Hiển thị thông báo lỗi

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200 ">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl h-[40rem] overflow-hidden">
        <div className="flex justify-between items-center mb-4 ml-10">
          <div className="flex items-center mt-4">
            <label className="text-gray-600 font-semibold mr-4" htmlFor="city">
              Your City
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={handleCityChange}
              className="border border-gray-300 rounded px-4 py-2 w-64"
              placeholder="Nhập tên thành phố"
            />
          </div>
        </div>
        <div className="flex space-x-6 mb-4 mt-[2rem] ml-10">
          <div className="flex flex-col gap-6 w-2/3">
            {weather && (
              <>
                <p className="text-gray-600">
                  {new Date(weather.location.localtime).toLocaleString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: "Asia/Ho_Chi_Minh",
                    }
                  )}{" "}
                  ,{" "}
                  {new Date(weather.location.localtime).toLocaleString(
                    "en-US",
                    {
                      weekday: "short",
                      timeZone: "Asia/Ho_Chi_Minh",
                    }
                  )}{" "}
                  ,{" "}
                  {new Date(weather.location.localtime).toLocaleString(
                    "en-US",
                    {
                      month: "short",
                      timeZone: "Asia/Ho_Chi_Minh",
                    }
                  )}{" "}
                  {new Date(weather.location.localtime).getDate()},
                  {new Date(weather.location.localtime).getFullYear()}
                </p>

                <div className="flex items-center mt-4">
                  <img
                    className="w-24"
                    src={weather.current.condition.icon}
                    alt="weather icon"
                    style={{ width: "10rem" }}
                  />
                  <span className="text-2xl font-bold ml-4">
                    {weather.current.temp_f}°F
                  </span>
                </div>

                <p className="text-xl font-semibold ml-15">
                  {weather.current.condition.text}
                </p>

                <div className="flex mt-15 ml-5">
                  <div className="mr-6">
                    <p className="text-gray-600 text-xl">Humidity</p>
                    <p className="font-bold text-xl mt-3">
                      {weather.current.humidity}%
                    </p>
                  </div>
                  <div className="mr-6">
                    <p className="text-gray-600 text-xl">Wind Speed</p>
                    <p className="font-bold text-xl mt-3">
                      {weather.current.wind_kph}km/j
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-2/3">
            <div className="flex items-center gap-4">
              <select
                id="type"
                value={type}
                onChange={handleChangeType}
                className="border border-gray-300 rounded px-4 py-2"
              >
                <option value="temp">Temperature</option>
                <option value="uv">UV</option>
                <option value="humidity">Humidity</option>
              </select>
            </div>

            <div className="mt-6" style={{ width: "100%", height: "300px" }}>
              {weather && <LineChart city={city} date={date} type={type} />}

              <div className="grid grid-cols-3 gap-4 mt-7">
                {weather &&
                  weather.forecast.forecastday.slice(0, 7).map((day) => {
                    const today = new Date();
                    const dayDate = new Date(day.date);

                    const isToday =
                      today.toDateString() === dayDate.toDateString();
                    const formattedDate = isToday
                      ? "Today"
                      : `${dayDate.toLocaleString("en-US", {
                          month: "short",
                        })} ${dayDate.getDate()}`;

                    return (
                      <div
                        key={day.date}
                        className={`${
                          date === day.date
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100"
                        } p-4 rounded-lg shadow-md text-center cursor-pointer`}
                        onClick={() => handleDateClick(day.date)}
                      >
                        <p className="font-semibold">{formattedDate}</p>
                        <img
                          className="w-12 mx-auto"
                          src={day.day.condition.icon}
                          alt="weather icon"
                        />
                        <div className="mt-4">
                          <p className="text-gray-600">Humidity</p>
                          <p>{day.day.avghumidity}%</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
