async function fetchCSVData(url) {
  const response = await fetch(url);
  const data = await response.text();
  return data;
}

async function scatterBubble(data, num) {
  const pdf = Plotly.d3.csv.parse(data);
  const names = pdf.map((row) => row.Movie_Title);

  const scatter = {
    trace: {
      x: pdf.map((row) => row.USD_Production_Budget),
      y: pdf.map((row) => row.USD_Worldwide_Gross),
      mode: "markers",
      type: "scatter",
      text: names,
    },
    layout: {
      resolution: { dpi: 120 },
      xaxis: {
        title: "Budget in $100 millions",
        range: [0, 450000000],
        showgrid: false,
        showline: true,
        linewidth: 1,
        linecolor: "black",
        mirror: true,
      },
      yaxis: {
        title: "Revenue in $ billions",
        range: [0, 3000000000],
        showgrid: false,
        showline: true,
        linewidth: 1,
        linecolor: "black",
        mirror: true,
      },
      font: {
        family: "Verdana",
      },
      autosize: true,
    },
    config: {
      responsive: true,
    },
  };
  const scatterElement = document.getElementById(`chart${num}`);

  Plotly.plot(scatterElement, [scatter.trace], scatter.layout, scatter.config);
}

async function scatterBubbleHue(data, num) {
  const pdf = Plotly.d3.csv.parse(data);

  const releaseDates = pdf.map((row) => new Date(row.Release_Date));

  const maxReleaseDate = Math.max(...releaseDates);
  const minReleaseDate = Math.min(...releaseDates);

  const yData = pdf.map((row) => row.USD_Production_Budget);

  const colorData = pdf.map((row) => row.USD_Worldwide_Gross);
  const sizeData = pdf.map((row) => row.USD_Worldwide_Gross);

  const desired_maximum_marker_size = 20;
  const max_size = Math.max(...sizeData);
  const sizeref = (2.0 * max_size) / desired_maximum_marker_size ** 2;

  const scatter = {
    trace: {
      x: releaseDates,
      y: yData,
      mode: "markers",
      type: "scatter",
      text: sizeData,
      marker: {
        color: colorData,
        size: sizeData,
        colorscale: "YlOrRd",
        sizemode: "area",
        sizeref: sizeref,
        showscale: true,
      },
    },
    layout: {
      resolution: { dpi: 120 },
      xaxis: {
        title: "Year",
        type: "date",
        showgrid: false,
        showline: true,
        linewidth: 1,
        linecolor: "black",
        mirror: true,
        range: [minReleaseDate, maxReleaseDate],
      },
      yaxis: {
        title: "Budget in $100 millions",
        range: [0, 450000000],
        showgrid: false,
        showline: true,
        linewidth: 1,
        linecolor: "black",
        mirror: true,
      },
      font: {
        family: "Verdana",
      },
      autosize: true,
    },
    config: {
      responsive: true,
    },
  };
  const hueElement = document.getElementById(`chart${num}`);

  Plotly.plot(hueElement, [scatter.trace], scatter.layout, scatter.config);
}

function linearRegression(x, y) {
  var lr = {};
  var n = y.length;
  var sum_x = 0;
  var sum_y = 0;
  var sum_xy = 0;
  var sum_xx = 0;
  var sum_yy = 0;

  for (var i = 0; i < y.length; i++) {
    sum_x += x[i];
    sum_y += y[i];
    sum_xy += x[i] * y[i];
    sum_xx += x[i] * x[i];
    sum_yy += y[i] * y[i];
  }

  lr["sl"] = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
  lr["off"] = (sum_y - lr.sl * sum_x) / n;
  lr["r2"] = Math.pow(
    (n * sum_xy - sum_x * sum_y) /
      Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)),
    2
  );

  return lr;
}

async function scatterRegression(data, pc, rc, op, bg, num) {
  const pdf = Plotly.d3.csv.parse(data);

  const xData = pdf.map((row) => parseInt(row.USD_Production_Budget));
  const yData = pdf.map((row) => parseInt(row.USD_Worldwide_Gross));
  const movieNames = pdf.map((row) => row.Movie_Title);

  const lr = linearRegression(xData, yData);

  const fit_from = Math.min(...xData);
  const fit_to = Math.max(...xData);

  const xmax = fit_to;
  const ymax = Math.max(...yData);

  const scatter = {
    trace: [
      {
        x: xData,
        y: yData,
        text: movieNames,
        mode: "markers",
        type: "scatter",
        line: {
          color: `${pc}`,
        },
        marker: {
          opacity: `${op}`,
        },
        name: "",
      },
      {
        x: [fit_from, fit_to],
        y: [fit_from * lr.sl + lr.off, fit_to * lr.sl + lr.off],
        mode: "lines",
        type: "scatter",
        line: {
          color: `${rc}`,
          width: 2,
        },
        name: "R<sup>2</sup>=".concat(
          (Math.round(lr.r2 * 10000) / 10000).toString()
        ),
      },
    ],
    layout: {
      resolution: { dpi: 120 },
      showlegend: false,
      title: "Regression Plot",
      xaxis: {
        title: "USD Production Budget",
        range: [0, xmax + 0.1 * xmax],
        showline: true,
        linecolor: "black",
        linewidth: 1,
        mirror: true,
      },
      yaxis: {
        title: "USD Worldwide Gross",
        range: [0, ymax + 0.1 * ymax],
        showline: true,
        linecolor: "black",
        linewidth: 1,
        mirror: true,
      },
      plot_bgcolor: `${bg}`,
      autosize: true,
    },
    config: {
      responsive: true,
    },
  };

  const regElement = document.getElementById(`chart${num}`);

  Plotly.plot(regElement, scatter.trace, scatter.layout, scatter.config);
}

async function runRegression(type) {
  let data;

  if (type === "old") {
    data = await fetchCSVData("static/assets/csv/df_clean_old.csv");
  } else {
    data = await fetchCSVData("static/assets/csv/df_clean_new.csv");
  }

  const pdf = Plotly.d3.csv.parse(data);

  const xData = pdf.map((row) => parseInt(row.USD_Production_Budget));
  const yData = pdf.map((row) => parseInt(row.USD_Worldwide_Gross));

  const lr = linearRegression(xData, yData);

  const budgetInput =
    parseInt(document.getElementById("budget").value) * 1000000;

  const resultDiv = document.getElementById("result");

  resultDiv.innerHTML = `Revenue: ${(
    (lr.sl * budgetInput + lr.off) /
    1000000
  ).toFixed(0)} millions, R<sup>2</sup>: ${lr.r2.toFixed(4)}`;
}

async function main() {
  try {
    const cleanData = await fetchCSVData("static/assets/csv/df_clean.csv");
    const cleanDataOld = await fetchCSVData(
      "static/assets/csv/df_clean_old.csv"
    );
    const cleanDataNew = await fetchCSVData(
      "static/assets/csv/df_clean_new.csv"
    );

    // Run plotting functions concurrently
    await Promise.all([
      scatterBubble(cleanData, 1),
      scatterBubbleHue(cleanData, 2),
      scatterRegression(
        cleanDataOld,
        "rgb(38, 120, 178)",
        "red",
        0.4,
        "white",
        3
      ),
      scatterRegression(
        cleanDataNew,
        "#2f4b7c",
        "#ff7c43",
        0.3,
        "rgb(234, 234, 242)",
        4
      ),
    ]);
  } catch (error) {
    console.error("Error loading or plotting data:", error);
  }
}

document.addEventListener("DOMContentLoaded", main);

const pre1970Button = document.getElementById("pre1970");
const after1970Button = document.getElementById("after1970");

pre1970Button.addEventListener("click", function () {
  runRegression("old");
});
after1970Button.addEventListener("click", function () {
  runRegression("new");
});
