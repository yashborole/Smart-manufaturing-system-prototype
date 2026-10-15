// Collection of verified high-resolution IoT Smart Factory photographs
export const IOT_FACTORY_IMAGES = [
  '/iot-factory-1.jpg', // Automated robotics & machining cell
  '/iot-factory-2.jpg', // Precision factory technician & IoT sensor telemetry
  '/iot-factory-3.jpg', // High-tech industrial operations control & monitoring center
  '/iot-factory-4.jpg', // Automotive robotics assembly line
  '/iot-factory-5.jpg', // Industrial robotic arm in manufacturing facility
  '/iot-factory-6.jpg', // Cleanroom production floor with automated conveyor
];

/**
 * Returns a random IoT factory image from the collection.
 */
export function getRandomIotFactoryImage(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    const idx = Math.abs(seed) % IOT_FACTORY_IMAGES.length;
    return IOT_FACTORY_IMAGES[idx];
  }
  const randomIdx = Math.floor(Math.random() * IOT_FACTORY_IMAGES.length);
  return IOT_FACTORY_IMAGES[randomIdx];
}
