const api_url = "https://mindicador.cl/api/";
let myChart = null;

async function getCoins(url) {
  try {
    const monedas = await fetch(url);
    const { dolar, ivp, euro, uf, utm } = await monedas.json();
    return [dolar, ivp, euro, uf, utm];
  } catch (error) {
    throw new Error(error);
  }
}

async function renderCoinOptions(url) {
  try {
    const select_container = document.getElementById("select_coin");
    const coins = await getCoins(url);

    coins.forEach((coin_info) => {
      const option = document.createElement("option");
      option.value = coin_info["codigo"];
      option.innerText = coin_info["nombre"];

      select_container.appendChild(option);

      //console.log(coin_info);
    });
  } catch (error) {
    throw new Error(error);
  }
}

async function getCoinDetails(url, coinID) {
  try {
    if (coinID) {
      const coin = await fetch(`${url}${coinID}`);
      const { serie } = await coin.json();
      const [{ valor: coinValue }] = serie;

      return coinValue;
    } else {
      alert("Seleciona moneda para conversión");
    }
  } catch (error) {
    throw new Error(error);
  }
}

async function getAndCreateDataToChart(url, coinID) {
  const coin = await fetch(`${url}${coinID}`);
  let { serie } = await coin.json();

  //obtiene los 10 ultimos
  // se recibe la serie con fechas de mayor a menor
  serie.splice(10, 10000);

  serie.forEach((elemento) => {
    elemento.fecha = invertirFecha(elemento.fecha.slice(0, 10));
  });

  //2023-12-29
  function invertirFecha(cad) {
    return (
      cad.substring(8, 10) +
      "/" +
      cad.substring(5, 7) +
      "/" +
      cad.substring(0, 4)
    );
  }

  console.log(serie);

  //console.log(serie[0].fecha);

  //ordenar serie menor a mayor fecha
  serie.sort(function (a, b) {
    if (a.fecha > b.fecha) {
      return 1;
    }
    if (a.fecha < b.fecha) {
      return -1;
    }
    // a must be equal to b
    return 0;
  });

  // Eje x de la gráfico
  const labels = serie.map(({ fecha }) => {
    return fecha;
  });
  // console.log(labels);
  // Zona vertical
  const data = serie.map(({ valor }) => {
    return valor;
  });

  const datasets = [
    {
      label: "Historial últimos 10 dias",
      borderColor: "rgb(255, 99, 132)",
      data,
    },
  ];

  return { labels, datasets };
}

async function renderGrafica() {
  const option_selected = document.getElementById("select_coin").value;

  const data = await getAndCreateDataToChart(api_url, option_selected);

  const config = {
    type: "line",
    data,
  };

  const canvas = document.getElementById("chart");
  canvas.style.backgroundColor = "white";

  if (myChart) {
    myChart.destroy();
  }

  myChart = new Chart(canvas, config);
}

// Esta funcion da inicio al proceso
document.getElementById("search").addEventListener("click", async (event) => {
  const option_selected = document.getElementById("select_coin").value;
  const coinValue = await getCoinDetails(api_url, option_selected);
  const inputPesos = document.getElementById("input-value").value;
  const convertion = (inputPesos / coinValue).toFixed(2);
  const valConvertion = document.querySelector("#result");

  if (inputPesos.length > 0 && !isNaN(convertion)) {
    valConvertion.textContent = `Resultado: ${convertion}`;
    renderGrafica();
  } else {
    alert("Ingresa una cantidad para conversión");
    myChart.destroy();
  }
});

renderCoinOptions(api_url);
