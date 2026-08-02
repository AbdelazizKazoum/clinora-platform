CREATE DATABASE IF NOT EXISTS `clinora_auth`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `clinora_patient`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `clinora_clinic`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `clinora_appointment`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'clinora_auth'@'%'
  IDENTIFIED BY 'clinora_auth_local_password';
CREATE USER IF NOT EXISTS 'clinora_patient'@'%'
  IDENTIFIED BY 'clinora_patient_local_password';
CREATE USER IF NOT EXISTS 'clinora_clinic'@'%'
  IDENTIFIED BY 'clinora_clinic_local_password';
CREATE USER IF NOT EXISTS 'clinora_appointment'@'%'
  IDENTIFIED BY 'clinora_appointment_local_password';

GRANT ALL PRIVILEGES ON `clinora_auth`.* TO 'clinora_auth'@'%';
GRANT ALL PRIVILEGES ON `clinora_patient`.* TO 'clinora_patient'@'%';
GRANT ALL PRIVILEGES ON `clinora_clinic`.* TO 'clinora_clinic'@'%';
GRANT ALL PRIVILEGES ON `clinora_appointment`.* TO 'clinora_appointment'@'%';

FLUSH PRIVILEGES;
