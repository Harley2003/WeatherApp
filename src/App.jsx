/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import debounce from "lodash.debounce"; // Import debounce từ lodash
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

// Constants
const ENDPOINT = "https://api.weatherapi.com/v1/forecast.json";
const APIKEY = "f5ac4be4a19c47d8a3e42522222112";

// Function to fetch weather data
const getWeather = async (city, countDay = 10) => {
  const response = await axios.get(
    `${ENDPOINT}?key=${APIKEY}&q=${city}&days=${countDay}&aqi=no&alerts=yes`
  );
  return response.data;
};

// LineChart component
// eslint-disable-next-line react/prop-types
const LineChart = ({ city, date, type }) => {
  const [dayData, setDayData] = useState([]);

  useEffect(() => {
    const filterData = async () => {
      try {
        const datas = await getWeather(city);

        const dataDate = datas?.forecast?.forecastday?.find(
          (item) => item.date === date
        );
        if (type === "temp") {
          setDayData([]);
          dataDate?.hour?.forEach((item) => {
            setDayData((prev) => [
              ...prev,
              { time: item.time, data: item.temp_f },
            ]);
          });
        }

        if (type === "uv") {
          setDayData([]);
          dataDate?.hour?.forEach((item) => {
            setDayData((prev) => [...prev, { time: item.time, data: item.uv }]);
          });
        }

        if (type === "humidity") {
          setDayData([]);
          dataDate?.hour?.forEach((item) => {
            setDayData((prev) => [
              ...prev,
              { time: item.time, data: item.humidity },
            ]);
          });
        }
      } catch (error) {
        console.log(error);
      }
    };

    filterData();
  }, [city, date, type]);

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
        label: `${
          type === "temp" ? "Temperature" : type === "uv" ? "UV" : "Humidity"
        }`,
        data: dt,
        fill: true,
        borderColor: `${
          type === "temp"
            ? "rgb(75, 192, 192)"
            : type === "uv"
            ? "rgb(227, 191, 12)"
            : "rgb(64, 136, 4)"
        }`,
        borderWidth: 1,
        pointRadius: 0,
        backgroundColor: `${
          type === "temp"
            ? "rgba(5, 86, 86, 0.2)"
            : type === "uv"
            ? "rgb(241, 223, 137)"
            : "rgba(185, 235, 143, 0.2)"
        }`,
        tension: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
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

  return (
    <div>
      <Line data={data} options={options} />
    </div>
  );
};

// App Component
const App = () => {
  const [city, setCity] = useState("Hà Nội");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState("temp");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const prevCityRef = useRef();
  const fetchWeatherDebounced = useRef(
    debounce(async (newCity) => {
      setLoading(true);
      try {
        const response = await getWeather(newCity);
        setWeather(response);
      } catch (err) {
        setError("Không thể lấy dữ liệu thời tiết.");
      } finally {
        setLoading(false);
      }
    }, 3000)
  ).current;

  useEffect(() => {
    // Prevent unnecessary API calls if the city hasn't changed
    if (prevCityRef.current !== city) {
      fetchWeatherDebounced(city);
      prevCityRef.current = city; // Update previous city value
    }
  }, [city, fetchWeatherDebounced]);

  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      setCity(e.target.value);
    }
  };

  const handleChangeType = (e) => {
    setType(e.target.value);
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p>{error}</p>;

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
              className="border border-gray-300 rounded px-4 py-2 w-full"
              placeholder="Nhập tên thành phố"
              onKeyPress={(e) => handleEnter(e)}
            />
          </div>
        </div>

        <div className="flex space-x-6 mb-4 mt-[2rem] ml-10">
          {/* ngày tháng năm */}
          <div className="flex flex-col gap-6 w-2/3">
            <p className="text-gray-600">
              {new Date(weather.location.localtime).toLocaleString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Ho_Chi_Minh",
              })}{" "}
              ,{" "}
              {new Date(weather.location.localtime).toLocaleString("en-US", {
                weekday: "short",
                timeZone: "Asia/Ho_Chi_Minh",
              })}{" "}
              ,{" "}
              {new Date(weather.location.localtime).toLocaleString("en-US", {
                month: "short",
                timeZone: "Asia/Ho_Chi_Minh",
              })}{" "}
              {new Date(weather.location.localtime).getDate()},
              {new Date(weather.location.localtime).getFullYear()}
            </p>

            <div className="flex items-center mt-4">
              <img
                className="w-24"
                src={weather.current.condition.icon}
                alt="weather icon"
              />
              <span className="text-2xl font-bold ml-4">
                {weather.current.temp_f}°F
              </span>
            </div>

            <p className="text-xl font-semibold ml-15">
              {weather.current.condition.text}
            </p>

            {/* humidyti */}
            <div className="flex mt-20 ml-5">
              <div className="mr-6">
                <p className="text-gray-600 text-xl">Humidity</p>
                <p className="font-bold text-xl mt-3">
                  {weather.current.humidity}%
                </p>
              </div>
              <div className="mr-6">
                <p className="text-gray-600 text-xl ">Wind Speed</p>
                <p className="font-bold text-xl mt-3">
                  {weather.current.wind_kph}km/j
                </p>
              </div>
            </div>
          </div>

          {/* biểu đồ */}
          <div className="w-2/3">
            <div className="flex items-center gap-4">
              <label className="text-gray-600" htmlFor="type">
                Loại Dữ Liệu
              </label>
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
              <LineChart city={city} date={date} type={type} />

              {/* hiển thị ngày */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                {weather.forecast.forecastday.slice(0, 7).map((day) => {
                  // Lấy ngày hiện tại
                  const today = new Date();
                  const dayDate = new Date(day.date);

                  // Kiểm tra nếu ngày là hôm nay
                  const isToday =
                    today.toDateString() === dayDate.toDateString();

                  // Format ngày tháng cho các ngày không phải hôm nay
                  const formattedDate = isToday
                    ? "Today"
                    : `${dayDate.toLocaleString("en-US", {
                        month: "short",
                      })} ${dayDate.getDate()}`;

                  return (
                    <div
                      key={day.date}
                      className={`${
                        isToday ? "bg-blue-500 text-white" : "bg-gray-100"
                      } p-4 rounded-lg shadow-md text-center`}
                    >
                      <p className="font-semibold">{formattedDate}</p>
                      {/* Hiển thị biểu tượng thời tiết */}
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

        <div className="flex space-x-6 mb-4 ml-35"></div>
      </div>
    </div>
  );
};

export default App;
