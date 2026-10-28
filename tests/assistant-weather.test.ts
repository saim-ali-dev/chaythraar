import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { answerAssistantMessage } from "@/lib/assistant/service";
import { answerWeatherQuestion, isWeatherQuestion, type WeatherLocationResolution } from "@/lib/assistant/weather";

const NOW = new Date("2026-01-01T20:00:00.000Z");
const CHITRAL: WeatherLocationResolution = {
  location: { name: "Chitral", latitude: 35.85, longitude: 71.79 },
  unsupportedName: null,
};

function dependencies(fetcher: typeof fetch, now = NOW) {
  return {
    fetcher,
    now,
    resolveLocation: async () => CHITRAL,
  };
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("weather questions route to live current conditions without RAG retrieval", async () => {
  const fetchMock = mock.method(globalThis, "fetch", () => Promise.resolve(response({
    current: { temperature_2m: 8.5, apparent_temperature: 6, weather_code: 1, wind_speed_10m: 4 },
  })));
  try {
    const result = await answerAssistantMessage("What is the weather like now?");
    assert.match(result.answer, /Current weather in Chitral on \d{4}-\d{2}-\d{2}/);
    assert.match(result.answer, /Open-Meteo Forecast API/);
    assert.deepEqual(result.sources, []);
    assert.equal(fetchMock.mock.callCount(), 1);
  } finally {
    fetchMock.mock.restore();
  }
});

test("future dates use the Forecast API within its supported range", async () => {
  let requestedUrl = "";
  const fetcher: typeof fetch = async (input) => {
    requestedUrl = String(input);
    return response({ daily: {
      time: ["2026-01-04"],
      weather_code: [61],
      temperature_2m_max: [7],
      temperature_2m_min: [-2],
      precipitation_sum: [3.2],
      wind_speed_10m_max: [12],
    } });
  };
  const result = await answerWeatherQuestion("Forecast weather on 2026-01-04", dependencies(fetcher));
  const url = new URL(requestedUrl);
  assert.equal(url.hostname, "api.open-meteo.com");
  assert.equal(url.searchParams.get("start_date"), "2026-01-04");
  assert.equal(url.searchParams.get("timezone"), "Asia/Karachi");
  assert.match(result.answer, /Forecast for Chitral on 2026-01-04/);
  assert.match(result.answer, /Open-Meteo Forecast API/);
});

test("an explicitly resolved supported location is used for the provider request", async () => {
  let requestedUrl = "";
  const result = await answerWeatherQuestion("Weather in Mastuj tomorrow", {
    now: NOW,
    resolveLocation: async () => ({
      location: { name: "Mastuj", latitude: 36.28, longitude: 72.17 },
      unsupportedName: null,
    }),
    fetcher: async (input) => {
      requestedUrl = String(input);
      return response({ daily: {
        time: ["2026-01-03"],
        weather_code: [0],
        temperature_2m_max: [5],
        temperature_2m_min: [-4],
      } });
    },
  });
  const url = new URL(requestedUrl);
  assert.equal(url.searchParams.get("latitude"), "36.28");
  assert.equal(url.searchParams.get("longitude"), "72.17");
  assert.match(result.answer, /Forecast for Mastuj on 2026-01-03/);
});

test("Mastuj resolves from either side of a relative date using public place records", async () => {
  const mastuj = { name: "Mastuj", latitude: 36.28, longitude: 72.17 };
  for (const question of ["Weather for tomorrow in Mastuj", "Weather in Mastuj for tomorrow"]) {
    let requestedUrl = "";
    const result = await answerWeatherQuestion(question, {
      now: NOW,
      places: [mastuj],
      fetcher: async (input) => {
        requestedUrl = String(input);
        return response({ daily: {
          time: ["2026-01-03"],
          weather_code: [0],
          temperature_2m_max: [5],
          temperature_2m_min: [-4],
        } });
      },
    });
    const url = new URL(requestedUrl);
    assert.equal(url.searchParams.get("latitude"), "36.28", question);
    assert.equal(url.searchParams.get("longitude"), "72.17", question);
    assert.match(result.answer, /Forecast for Mastuj on 2026-01-03/, question);
  }
});

test("past dates use Historical Weather API and identify reanalysis correctly", async () => {
  let requestedUrl = "";
  const fetcher: typeof fetch = async (input) => {
    requestedUrl = String(input);
    return response({ daily: {
      time: ["2025-12-31"],
      weather_code: [71],
      temperature_2m_max: [2],
      temperature_2m_min: [-8],
      precipitation_sum: [0],
      wind_speed_10m_max: [9],
    } });
  };
  const result = await answerWeatherQuestion("What was the weather on 2025-12-31?", dependencies(fetcher));
  assert.equal(new URL(requestedUrl).hostname, "archive-api.open-meteo.com");
  assert.match(result.answer, /Historical reanalysis estimate.*2025-12-31/);
  assert.match(result.answer, /not a direct observation from a local weather station/);
  assert.match(result.answer, /Open-Meteo Historical Weather API/);
});

test("invalid calendar dates are rejected without a provider request", async () => {
  let requestCount = 0;
  const fetcher: typeof fetch = async () => {
    requestCount += 1;
    return response({});
  };
  const result = await answerWeatherQuestion("Weather on 2026-02-30", dependencies(fetcher));
  assert.match(result.answer, /2026-02-30.*not a valid calendar date/);
  assert.equal(requestCount, 0);
});

test("day-first named dates without a year use the Asia/Karachi current year", async () => {
  const now = new Date("2026-10-25T12:00:00.000Z");
  for (const [question, expectedDate] of [
    ["Weather on 28 October", "2026-10-28"],
    ["Weather for 5 November", "2026-11-05"],
  ]) {
    let requestedUrl = "";
    const result = await answerWeatherQuestion(question, {
      now,
      resolveLocation: async () => CHITRAL,
      fetcher: async (input) => {
        requestedUrl = String(input);
        return response({ daily: {
          time: [expectedDate],
          weather_code: [0],
          temperature_2m_max: [5],
          temperature_2m_min: [-2],
        } });
      },
    });
    assert.equal(new URL(requestedUrl).searchParams.get("start_date"), expectedDate);
    assert.match(result.answer, new RegExp(expectedDate));
  }
});

test("day-first named dates preserve an explicit year", async () => {
  let requestedUrl = "";
  await answerWeatherQuestion("Weather on 28 October 2025", {
    now: new Date("2026-10-25T12:00:00.000Z"),
    resolveLocation: async () => CHITRAL,
    fetcher: async (input) => {
      requestedUrl = String(input);
      return response({ daily: {
        time: ["2025-10-28"],
        weather_code: [0],
        temperature_2m_max: [5],
        temperature_2m_min: [-2],
      } });
    },
  });
  assert.equal(new URL(requestedUrl).searchParams.get("start_date"), "2025-10-28");
});

test("invalid day-first named dates are rejected without a provider request", async () => {
  let requestCount = 0;
  const result = await answerWeatherQuestion("Weather on 31 February", {
    ...dependencies(async () => {
      requestCount += 1;
      return response({});
    }),
    now: new Date("2026-01-01T12:00:00.000Z"),
  });
  assert.match(result.answer, /2026-02-31.*not a valid calendar date/);
  assert.equal(requestCount, 0);
});

test("unsupported explicit day-first date wording asks for clarification", async () => {
  let requestCount = 0;
  const result = await answerWeatherQuestion("Weather on 28 Oct", {
    ...dependencies(async () => {
      requestCount += 1;
      return response({});
    }),
  });
  assert.match(result.answer, /could not reliably interpret the requested date/);
  assert.equal(requestCount, 0);
});

test("dates outside forecast or historical API ranges explain the limitation", async () => {
  let requestCount = 0;
  const fetcher: typeof fetch = async () => {
    requestCount += 1;
    return response({});
  };
  const future = await answerWeatherQuestion("Forecast weather on 2026-01-18", dependencies(fetcher));
  const past = await answerWeatherQuestion("Historical weather on 1939-12-31", dependencies(fetcher));
  assert.match(future.answer, /supports dates up to 15 days ahead/);
  assert.match(past.answer, /starts on 1940-01-01/);
  assert.equal(requestCount, 0);
});

test("provider failures return a dated, source-labeled fallback", async () => {
  const fetcher: typeof fetch = async () => {
    throw new Error("network unavailable");
  };
  const result = await answerWeatherQuestion("Weather tomorrow", dependencies(fetcher));
  assert.match(result.answer, /Chitral on 2026-01-03 is temporarily unavailable/);
  assert.match(result.answer, /Source: Open-Meteo Forecast API/);
});

test("malformed provider payloads return the same graceful fallback", async () => {
  const result = await answerWeatherQuestion("Weather tomorrow", dependencies(async () => response({ daily: { time: ["2026-01-03"] } })));
  assert.match(result.answer, /Chitral on 2026-01-03 is temporarily unavailable/);
  assert.match(result.answer, /Source: Open-Meteo Forecast API/);
});

test("dates and relative days are interpreted in Asia/Karachi", async () => {
  const result = await answerWeatherQuestion("Weather today", {
    ...dependencies(async () => response({
      current: { temperature_2m: 5, weather_code: 0 },
    }), new Date("2026-01-01T20:00:00.000Z")),
  });
  assert.match(result.answer, /2026-01-02/);
});

test("next weekdays and spelled-out day offsets resolve to exact Karachi dates", async () => {
  for (const [question, expectedDate] of [
    ["Weather next Friday", "2026-01-09"],
    ["Weather in three days", "2026-01-05"],
  ]) {
    let requestedUrl = "";
    const result = await answerWeatherQuestion(question, {
      now: NOW,
      resolveLocation: async () => CHITRAL,
      fetcher: async (input) => {
        requestedUrl = String(input);
        const requestedDate = new URL(requestedUrl).searchParams.get("start_date");
        return response({ daily: {
          time: [requestedDate],
          weather_code: [0],
          temperature_2m_max: [4],
          temperature_2m_min: [-3],
        } });
      },
    });
    assert.equal(new URL(requestedUrl).searchParams.get("start_date"), expectedDate);
    assert.ok(result.answer.includes(expectedDate));
  }
});

test("unrecognized explicit date phrases request clarification instead of using today", async () => {
  let requestCount = 0;
  const result = await answerWeatherQuestion("Weather in a few days", {
    ...dependencies(async () => {
      requestCount += 1;
      return response({});
    }),
  });
  assert.match(result.answer, /could not reliably interpret the requested date/);
  assert.equal(requestCount, 0);
});

test("temperature adjectives require weather context and hot springs stay on normal intent", () => {
  assert.equal(isWeatherQuestion("How cold will it be tomorrow?"), true);
  assert.equal(isWeatherQuestion("What is the weather in Chitral?"), true);
  assert.equal(isWeatherQuestion("What are the hot springs near Chitral?"), false);
});