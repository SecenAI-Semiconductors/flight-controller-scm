/**
 * storeContent.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all customer-facing product content.
 * Swap values here (or later load from API) — components stay untouched.
 *
 * Placeholders: anything not yet decided is marked with a "[… TBD]" suffix.
 */

export const PRODUCT = {
  brand: 'SECENAI',
  name: 'SECENAI FC H743 V1',
  tagline: 'High-performance flight controller with multi-sensor redundancy.',
  description:
    'Powered by STM32H743 processing, triple inertial sensing, dual barometric pressure measurement and extensive UAV connectivity for advanced autonomous platforms.',
  price: '[PRICE TBD]',
  sku: '[SKU TBD]',
  image: '/images/secenai-fc-h743-v1.png',
  marketingUrl: 'https://www.secenai.com/explore/secenai-fc-h743-v1',
};

export const HIGHLIGHTS = [
  {
    heading: 'STM32H743',
    sub: 'Cortex-M7 processing up to 480 MHz',
  },
  {
    heading: '3× IMUs',
    sub: '2× ICM-42688-P + 1× ICM-42605',
  },
  {
    heading: '2× BMP581',
    sub: 'Independent dual barometric sensing',
  },
  {
    heading: '5-36 V',
    sub: 'Protected redundant power inputs',
  },
];

export const SPECS = [
  { label: 'Processor', value: 'STM32H743 (Arm Cortex-M7, up to 480 MHz)' },
  { label: 'IMUs', value: '2× ICM-42688-P + 1× ICM-42605 (two share SPI bus A, the third is on separate SPI bus B)' },
  { label: 'Barometers', value: '2× BMP581, independent SPI connections' },
  { label: 'Redundancy', value: 'Automatic IMU failover, sensor voting, IMU fault isolation, firmware barometer cross-check' },
  { label: 'Power', value: '5-36 V input, two protected power inputs, power redundancy' },
  { label: 'UART', value: '6×' },
  { label: 'CAN', value: '2× (DroneCAN-ready)' },
  { label: 'I2C', value: '3×' },
  { label: 'SPI', value: '8×' },
  { label: 'ADC', value: '2×' },
  { label: 'PWM / Servo', value: '14× (DShot-capable)' },
  { label: 'AUX', value: '2× (DShot-capable)' },
  { label: 'Also includes', value: 'GPS support, RC input, USB Type-C, internal Molex USB, external MicroSD logging, Molex connectors (Pixhawk-standard connector approach)' },
  { label: 'Firmware', value: 'ArduPilot and PX4 supported. Exact versions and board targets will be published after final validation.' },
  { label: 'Mounting', value: 'M2.5 holes, PCB and enclosure vibration isolation' },
  { label: 'Board dimensions', value: '70 × 85 mm' },
  { label: 'PCB thickness', value: '1.6 mm' },
  { label: 'Weight', value: '40-50 g' },
];

export const SPECS_NOTE =
  'Pinout documentation and final mechanical dimensions coming soon.';

export const SUPPORT = {
  supportEmail: 'support@secenai.com',
  salesEmail: 'sales@secenai.com',
};
