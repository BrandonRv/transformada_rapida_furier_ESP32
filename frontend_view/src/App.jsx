import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import FFT from 'fft.js';  // Asegúrate de tener fft.js instalada: npm install fft.js

function App() {
  const [dataESP, setDataESP] = useState([]);
  const [fftData, setFftData] = useState([]);
  const [adcBuffer, setAdcBuffer] = useState([]); // esto aqui era para hacer otra cosa pero al final nunca se uso
  const [startTime, setStartTime] = useState(Date.now());
  const BUFFER_SIZE = 256; // Tamaño del buffer para la FFT, debe ser una potencia de 2

  useEffect(() => {
    const interval = setInterval(fetchSerialData, 60); // Actualizar cada 60 ms

    async function fetchSerialData() {
      try {
        const response = await fetch('http://127.0.0.1:3000/seno');
        const apiData = await response.json();

        // Extraer el valor de ADC2 Rango lectura del pin analogo
        const adc2Match = apiData.seno.match(/ADC2:\s*(\d+)/);
        const adc2Value = adc2Match ? parseInt(adc2Match[1], 10) : null;

        if (adc2Value !== null) {
          // Agregar el valor al buffer de ADC
          setAdcBuffer(prevBuffer => {
            const newBuffer = [...prevBuffer, adc2Value];
            if (newBuffer.length >= BUFFER_SIZE) {
              calculateFFT(newBuffer); // Calcular la FFT cuando se llena el buffer
              return newBuffer.slice(-BUFFER_SIZE); // Mantener sólo los últimos BUFFER_SIZE valores
            }
            return newBuffer;
          });
        }

        // Extraer el valor de Voltaje lectura bus serial
        const voltageMatch = apiData.seno.match(/Voltaje:\s*([0-9.]+)/);
        const voltageValue = voltageMatch ? parseFloat(voltageMatch[1]) : null;

        // Verifica si hay un valor válido
        if (voltageValue !== null) {
          // Agregar el valor al array de datos
          setDataESP(prevData => {
            const time = Date.now() - startTime; // Tiempo relativo desde el inicio
            const newData = [...prevData, { time, value: voltageValue }];
            // Limitar el tamaño del array para mantener una ventana de tiempo manejable
            return newData.slice(-100); // Ajusta según tus necesidades
          });
        }
      } catch (error) {
        console.error('Error fetching serial data:', error);
      }
    }

    return () => clearInterval(interval);
  }, [startTime]);

  const calculateFFT = (data) => {
    // Crear una instancia de FFT con el tamaño del buffer
    const fft = new FFT(BUFFER_SIZE);
    const phasors = fft.createComplexArray();
    const magnitudes = fft.createComplexArray();

    // Copiar los datos al array complejo (los imaginarios son 0)
    for (let i = 0; i < BUFFER_SIZE; i++) {
      phasors[2 * i] = data[i];  // Parte real
      phasors[2 * i + 1] = 0;    // Parte imaginaria
    }

    // Realizar la FFT
    fft.transform(magnitudes, phasors);

    // Calcular la magnitud (norma) de los componentes de frecuencia
    const fftMagnitudes = [];
    for (let i = 0; i < BUFFER_SIZE / 2; i++) { // Solo la mitad de los valores son relevantes
      const real = magnitudes[2 * i];
      const imag = magnitudes[2 * i + 1];
      const magnitude = Math.sqrt(real * real + imag * imag);
      const frequency = i * (1 / (BUFFER_SIZE * 0.00006)); // Aproximar frecuencia en Hz (ajustar según tiempo de muestreo)
      fftMagnitudes.push({ frequency, magnitude });
    }

    // Actualizar los datos de FFT
    setFftData(fftMagnitudes);
  };

  return (
    <>
      <h2 style={{ color: 'black', paddingBottom: '10px' }}>Forma de Onda: </h2>
      <div style={{ marginTop: '1px', paddingLeft: '40px' }}>
        <LineChart width={768} height={412} data={dataESP}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={time => (time / 1000).toFixed(2) + 's'} // Mostrar tiempo relativo en segundos
          />
          <YAxis
            domain={[-1.65, 1.65]} // Ajusta según el rango esperado de la señal
            tickFormatter={volt => volt.toFixed(2) + 'V'} // Formato de voltaje en el eje Y
          />
          <Tooltip />
          <Legend />
          <Line type="linear" dataKey="value" stroke="#8884d8" dot={false} /> {/* Ajuste a 'value' y sin puntos */}
        </LineChart>
      </div>

      {/* AQUI ABAJO ES LA GRAFICA PARA LA Transformada rápida de Fourier */}
      <h2 style={{ color: 'black', paddingBottom: '10px' }}>Transformada rápida de Fourier FFT Y Armonicos: </h2>
      <div id='grafica_FFT' style={{ marginTop: '20px', paddingLeft: '40px' }}>
        <LineChart width={768} height={412} data={fftData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="frequency"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={freq => freq.toFixed(2) + 'Hz'}
          />
          <YAxis
            tickFormatter={magnitude => magnitude.toFixed(2) + 'dB'}
          />
          <Tooltip />
          <Legend />
          <Line type="linear" dataKey="magnitude" stroke="#8884d8" dot={false} />
        </LineChart>
      </div>
    </>
  );
}

export default App;
