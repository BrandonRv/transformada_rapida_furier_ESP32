#include <Arduino.h>

// Definición del pin ADC
const int adcPin = 33;

// Tamaño del buffer
const int bufferSize = 200; // Tamaño del buffer

// Buffer para almacenar lecturas de ADC
int adcBuffer[bufferSize];
float voltageBuffer[bufferSize];

// Índice del buffer
int bufferIndex = 0;

// Intervalos de tiempo
unsigned long previousMillis = 0;
unsigned long previousSendMillis = 0; // Tiempo previo para enviar datos

const unsigned long samplingInterval = 5; // Intervalo de muestreo en ms (reducido para aumentar la frecuencia de muestreo)
const unsigned long sendingInterval = 600; // Intervalo para enviar datos en ms

void setup() {
  Serial.begin(115200);  // Configurar la velocidad del puerto serial
  pinMode(adcPin, INPUT); // Configurar el pin ADC como entrada
}

////////////////////////////////////////////////////////////
//-----------------  Funciones Depuradas -----------------//
////////////////////////////////////////////////////////////

// Función para leer el ADC y almacenar en el buffer
void readADC() {
  // Leer el valor del ADC
  int adcValue = analogRead(adcPin);

  // Convertir el valor ADC a voltaje
  float voltage = adcValue * (3.3 / 4095.0);

  // Almacenar los valores en el buffer
  adcBuffer[bufferIndex] = adcValue;
  voltageBuffer[bufferIndex] = voltage;

  // Incrementar el índice del buffer
  bufferIndex++;

  // Si el índice del buffer supera el tamaño, reiniciarlo (aunque normalmente nunca debería pasar)
  if (bufferIndex >= bufferSize) {
    bufferIndex = 0;
  }
}

// Función para enviar los datos del buffer por el puerto serial
void sendBuffer() {
  Serial.print("Data Start\n");

  for (int i = 0; i < bufferIndex; i++) {
    Serial.print("ADC2: ");
    Serial.print(adcBuffer[i]);
    Serial.print(", Voltaje: ");
    Serial.println(voltageBuffer[i]);
  }

  Serial.print("Data End\n");

  // Reiniciar el índice del buffer después de enviar
  bufferIndex = 0;
}

////////////////////////////////////////////////////////////
//-------------- Fin de Funciones Depuradas --------------//
////////////////////////////////////////////////////////////

void loop() {
  // Obtener el tiempo actual
  unsigned long currentMillis = millis();

  // Leer el ADC a intervalos regulares (sin usar delay)
  if (currentMillis - previousMillis >= samplingInterval) {
    previousMillis = currentMillis;
    readADC();
  }

  // Enviar el buffer por el puerto serial a intervalos regulares
  if (currentMillis - previousSendMillis >= sendingInterval) {
    previousSendMillis = currentMillis;
    sendBuffer();
  }
}


